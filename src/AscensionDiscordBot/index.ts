import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { LOG_CHANNEL_ID, TRADING_CHANNEL_ID } from '../constants/discord'
import { BigNumber, ethers, Event } from 'ethers'

import { ASCEND_SUSHI_POOL } from '../constants/addresses'

export default class AscensionDiscordBot {
  private _client: Client
  private _provider: ethers.providers.AlchemyProvider
  private _token: ethers.Contract

  constructor(
    client: Client<true>,
    provider: ethers.providers.AlchemyProvider,
    token: ethers.Contract
  ) {
    this._client = client
    this._provider = provider
    this._token = token
  }

  private _log(message: string) {
    const logChannel = this._client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel
    logChannel.send(message)
  }

  subscribeToTransfers() {
    const tradingChannel = this._client.channels.cache.get(TRADING_CHANNEL_ID) as TextChannel
    this._log(`Started ASCEND Transfer watchdog @ ${new Date(Date.now()).toUTCString()}`)

    this._token.on('Transfer', (from: string, to: string, value: BigNumber, event: Event) => {
      if (from === ASCEND_SUSHI_POOL) {
        const embed = new MessageEmbed()
          .setColor('#FFFFFF')
          .setTitle('New ASCEND buy order')
          .setURL(`https://arbiscan.io/tx/${event.transactionHash}`)
          .setTimestamp(new Date())
          .addFields([
            { name: 'Account', value: to },
            { name: 'Amount', value: `${ethers.utils.formatUnits(value)} ASCEND` },
          ])

        tradingChannel.send({ embeds: [embed] })
        return
      }

      if (to === ASCEND_SUSHI_POOL) {
        const embed = new MessageEmbed()
          .setColor('#FFFFFF')
          .setTitle('New ASCEND sell order')
          .setURL(`https://arbiscan.io/tx/${event.transactionHash}`)
          .setTimestamp(new Date())
          .addFields([
            { name: 'Account', value: from },
            { name: 'Amount', value: `${ethers.utils.formatUnits(value)} ASCEND` },
          ])
        tradingChannel.send({ embeds: [embed] })
        return
      }

      const embed = new MessageEmbed()
        .setColor('#FFFFFF')
        .setTitle('New ASCEND transfer')
        .setURL(`https://arbiscan.io/tx/${event.transactionHash}`)
        .setTimestamp(new Date())
        .addFields([
          { name: 'From', value: from },
          { name: 'To', value: to },
          { name: 'Amount', value: `${ethers.utils.formatUnits(value)} ASCEND` },
        ])
      tradingChannel.send({ embeds: [embed] })
      return
    })
  }
}
