import 'dotenv/config'
import { Client, ClientOptions, Intents } from 'discord.js'
import AscensionDiscordBot from './AscensionDiscordBot'
import { ethers } from 'ethers'
import contractsInfo from './contractsInfo.json'

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const options: ClientOptions = { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }
const client = new Client(options)

async function main() {
  const provider = new ethers.providers.AlchemyProvider(42161, process.env.ARBITRUM_ALCHEMY_API_KEY)
  await provider.ready
  const token = new ethers.Contract(
    contractsInfo.contracts.AscensionToken.address,
    contractsInfo.contracts.AscensionToken.abi,
    provider
  )
  client.on('ready', (client) => {
    console.log(`logged in as ${client.user?.tag}`)

    const ascensionBot = new AscensionDiscordBot(client, provider, token)

    ascensionBot.subscribeToTransfers()
    ascensionBot.watchPrice()
  })
}

main().catch((err) => {
  console.error(err)
  process.exit()
})

client.login(DISCORD_TOKEN)
