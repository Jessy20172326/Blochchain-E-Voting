# Database_API/main.py
import dotenv
import os
import mysql.connector
from fastapi import FastAPI, HTTPException, status, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import errorcode
import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel

# Load environment variables
dotenv.load_dotenv()

app = FastAPI()

# CORS setup
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB connection
try:
    cnx = mysql.connector.connect(
        user=os.environ['MYSQL_USER'],
        password=os.environ['MYSQL_PASSWORD'],
        host=os.environ['MYSQL_HOST'],
        database=os.environ['MYSQL_DB'],
    )
    print("Database connection successful")
    cursor = cnx.cursor()
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("DB user/pass error")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("DB does not exist")
    else:
        print(err)

# JWT setup
SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Login request model
class LoginRequest(BaseModel):
    voter_id: str
    password: str

# JWT utility functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request):
    """Get JWT from Authorization header and decode it"""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        voter_id: str = payload.get("voter_id")
        if voter_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/login")
async def login(login_data: LoginRequest):
    """Validate voter credentials and return JWT"""
    voter_id = login_data.voter_id
    password = login_data.password
    try:
        cursor.execute(
            "SELECT role FROM voters WHERE voter_id = %s AND password = %s", 
            (voter_id, password)
        )
        result = cursor.fetchone()
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid voter ID or password"
            )
        
        role = result[0]
        # create JWT token
        access_token = create_access_token(
            data={"voter_id": voter_id, "role": role}
        )
        return {"access_token": access_token, "token_type": "bearer", "role": role}
        
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# Protected route example (yet to be developed)
# @app.get("/protected-data")
# async def protected_data(current_user: dict = Depends(get_current_user)):
#     return {"message": f"Hello {current_user['voter_id']}", "role": current_user["role"]}