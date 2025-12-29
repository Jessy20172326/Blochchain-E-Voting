module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      // network_id: "*" // Match any network id
      network_id: "1337"  //only match 1337
    }
  }
}
