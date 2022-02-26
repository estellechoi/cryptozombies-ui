import cryptoZombiesABI from '@/abis/cryptozombies.json'
import { CRYPTOZOMBIES_ADDRESS } from '@/constants/addresses'
import Web3 from 'web3'

let web3js: Web3
let cryptoZombies: Contract
let userAccount: string
let accountInterval

// Web3가 브라우저에 주입되었는지 확인(Mist/MetaMask)
if (web3 !== undefined) {
	// Mist/MetaMask의 프로바이더 사용
	web3js = new Web3(web3.currentProvider)
} else {
	// 사용자가 Metamask를 설치하지 않은 경우에 대해 처리
	// 사용자들에게 Metamask를 설치하라는 등의 메세지를 보여줄 것
	// use Infura as our Ethereum node provider
	/**
    const web3 = new Web3(
    new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws")
    );
*/
}

// 이제 자네 앱을 시작하고 web3에 자유롭게 접근할 수 있네:
startApp()

function startApp() {
	cryptoZombies = new web3js.eth.Contract(
		cryptoZombiesABI,
		CRYPTOZOMBIES_ADDRESS
	)

	accountInterval = setInterval(async () => {
		// web3.eth.accounts[0] → returns activated account auto-updated by MetaMask extension.
		if (web3.eth.accounts[0] !== userAccount) {
			userAccount = web3.eth.accounts[0]
			const zombieIds = await getZombiesByOwner(userAccount)
			displayZombies(zombieIds)
		}
	}, 100)

	// subscribe the event Transfer
	// when listening to the evet, you can filter the emmited events if indexed in the contract.
	cryptoZombies.events
		.Transfer({ filter: { _to: userAccount } })
		.on('data', async (event) => {
			const data = event.returnValues
			const zombieIds = await getZombiesByOwner(userAccount)
			displayZombies(zombieIds)
		})
		.on('error', console.error)
}

async function displayZombies(ids: string[]) {
	for (const id of ids) {
		const zombie = await getZombieDetails(id)
		console.log(zombie)
	}
}

function createRandomZombie(name: string) {
	cryptoZombies.methods
		.createRandomZombie(name)
		.send({ from: userAccount })
		.on('receipt', async (receipt) => {
			console.log(receipt)
			const zombieIds = await getZombiesByOwner(userAccount)
			displayZombies(zombieIds)
		})
		.on('error', (error) => {
			console.log(error)
		})
}

function feedOnKitty(zombieId, kittyId) {
	cryptoZombies.methods
		.feedOnKitty(zombieId, kittyId)
		.send({ from: userAccount })
		.on('receipt', async (receipt) => {
			console.log(receipt)
			const zombieIds = await getZombiesByOwner(userAccount)
			displayZombies(zombieIds)
		})
		.on('error', (error) => {
			console.log(error)
		})
}

function levelUp(zombieId) {
	cryptoZombies.methods
		.levelUp(zombieId)
		.send({ from: userAccount, value: web3js.utils.toWei('0.001') })
		.on('receipt', async (receipt) => {
			console.log(receipt)
		})
		.on('error', (error) => {
			console.log(error)
		})
}

// call() is for view/pure functions of contracts
// Zombie[] public zombies; → has auto-made getters function for the public variable
function getZombieDetails(zombieId: string) {
	return cryptoZombies.methods.zombies(zombieId).call()
}

// mapping (uint => address) public zombieToOwner;
function zombieToOwner(zombieId: string) {
	return cryptoZombies.methods.zombieToOwner(zombieId).call()
}

// function getZombiesByOwner(address _owner)
function getZombiesByOwner(owner: string) {
	return cryptoZombies.methods.getZombiesByOwner(owner).call()
}
