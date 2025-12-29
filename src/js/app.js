// src/js/app.js
const Web3 = require('web3');
const contract = require('@truffle/contract');
const votingArtifacts = require('../../build/contracts/Voting.json');

const VotingContract = contract(votingArtifacts);

window.App = {
  web3: null,
  account: null,

  start: async function () {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      this.web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.account = accounts[0];

      VotingContract.setProvider(this.web3.currentProvider);
      VotingContract.defaults({ from: this.account, gas: 6654755 });

      // 显示账户地址（如果存在）
      const accountEl = document.getElementById('accountAddress');
      if (accountEl) {
        accountEl.innerText = 'Your Account: ' + this.account;
      }

      const instance = await VotingContract.deployed();
      await this.loadAndBind(instance);

    } catch (error) {
      console.error('App initialization failed:', error);
      alert('Failed to connect to MetaMask: ' + (error.message || error));
    }
  },

  // 单独加载候选人列表
  loadCandidates: async function (instance, container) {
    try {
      const count = await instance.getCountCandidates();
      container.innerHTML = ''; // 清空旧列表

      for (let i = 1; i <= count; i++) {
        try {
          const data = await instance.getCandidate(i);
          const id = data[0].toString();
          const name = data[1];
          const party = data[2];
          const voteCount = data[3].toString();

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>
              <input class="form-check-input" type="radio" name="candidate" value="${id}" id="cand-${id}">
              ${name}
            </td>
            <td>${party}</td>
            <td>${voteCount}</td>
          `;
          container.appendChild(row);
        } catch (err) {
          console.warn(`Skip candidate ${i}:`, err);
        }
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  },

  // 加载并显示投票日期
  loadVotingDates: async function (instance) {
    const datesEl = document.getElementById('dates');
    if (!datesEl) return;

    try {
      const dates = await instance.getDates();
      const startDate = new Date(dates[0] * 1000);
      const endDate = new Date(dates[1] * 1000);
      datesEl.innerText = `${startDate.toDateString()} - ${endDate.toDateString()}`;
    } catch (err) {
      console.warn('Could not load voting dates:', err);
    }
  },

  loadAndBind: async function (instance) {
    try {
      // ====== 管理员功能（仅在 admin.html） ======
      const addCandidateBtn = document.getElementById('addCandidate');
      const nameInput = document.getElementById('name');
      const partyInput = document.getElementById('party');
      const candidateContainer = document.getElementById('boxCandidate');

      if (addCandidateBtn && nameInput && partyInput) {
        addCandidateBtn.addEventListener('click', async () => {
          const name = nameInput.value.trim();
          const party = partyInput.value.trim();
          if (!name || !party) {
            alert('Please enter both name and party.');
            return;
          }
          try {
            await instance.addCandidate(name, party);
            alert('Candidate added successfully!');
            // 清空输入框，但不清空页面
            nameInput.value = '';
            partyInput.value = '';
            // 如果当前页面有候选人列表，刷新它
            if (candidateContainer) {
              await this.loadCandidates(instance, candidateContainer);
            }
          } catch (err) {
            console.error('Add candidate failed:', err);
            alert('Failed to add candidate. Check console.');
          }
        });
      }

      // ====== 日期设置（仅在 admin.html） ======
      const addDateBtn = document.getElementById('addDate');
      const startDateInput = document.getElementById('startDate');
      const endDateInput = document.getElementById('endDate');

      if (addDateBtn && startDateInput && endDateInput) {
        addDateBtn.addEventListener('click', async () => {
          const startDateVal = startDateInput.value;
          const endDateVal = endDateInput.value;
          if (!startDateVal || !endDateVal) {
            alert('Please select both start and end dates.');
            return;
          }
          try {
            const startDate = Math.floor(new Date(startDateVal).getTime() / 1000);
            const endDate = Math.floor(new Date(endDateVal).getTime() / 1000);
            await instance.setDates(startDate, endDate);
            alert('Voting dates updated!');
            // 刷新日期显示（如果存在）
            await this.loadVotingDates(instance);
          } catch (err) {
            console.error('Set dates failed:', err);
            alert('Failed to set dates. Check console.');
          }
        });
      }

      // ====== 通用：加载投票日期（admin 和 voter 都可能有 #dates） ======
      await this.loadVotingDates(instance);

      // ====== 选民功能（仅在 index.html） ======
      if (candidateContainer) {
        await this.loadCandidates(instance, candidateContainer);
      }

      // 投票按钮
      const voteButton = document.getElementById('voteButton');
      if (voteButton) {
        const hasVoted = await instance.checkVote();
        voteButton.disabled = hasVoted;
        // 注意：onclick 已在 HTML 中绑定，此处不重复绑定
      }

    } catch (error) {
      console.error('Failed to load voting data:', error);
    }
  },

  vote: async function () {
    const selected = document.querySelector('input[name="candidate"]:checked');
    if (!selected) {
      const msgEl = document.getElementById('msg');
      if (msgEl) msgEl.innerHTML = '<p>Please select a candidate.</p>';
      return;
    }

    try {
      const instance = await VotingContract.deployed();
      await instance.vote(parseInt(selected.value, 10));

      const voteButton = document.getElementById('voteButton');
      if (voteButton) {
        voteButton.disabled = true;
      }

      const msgEl = document.getElementById('msg');
      if (msgEl) {
        msgEl.innerHTML = '<p>Voted successfully!</p>';
      }
      // 不再 reload！状态通过 disabled 反馈
    } catch (error) {
      console.error('Voting failed:', error);
      const msgEl = document.getElementById('msg');
      if (msgEl) {
        msgEl.innerHTML = '<p>Voting failed. Check console.</p>';
      }
    }
  }
};

window.addEventListener('load', () => {
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask detected. Initializing...');
    window.App.start();
  } else {
    alert('MetaMask is not installed. Please install it to use this dApp.');
  }
});