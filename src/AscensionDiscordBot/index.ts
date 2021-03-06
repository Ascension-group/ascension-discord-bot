import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { LOG_CHANNEL_ID, TRADING_CHANNEL_ID } from '../constants/discord'
import { BigNumber, ethers, Event } from 'ethers'

import { ASCEND_STAKING, ASCEND_SUSHI_POOL } from '../constants/addresses'
import axios from 'axios'

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
      //HANDLE SWAP TX
      if (from === ASCEND_SUSHI_POOL) {
        const embed = new MessageEmbed()
          .setColor('#10B981')
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
          .setColor('#EF4444')
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

      //HANDLE STAKING TX
      if (to === ASCEND_STAKING) {
        const embed = new MessageEmbed()
          .setColor('#10B981')
          .setTitle('ASCEND staking deposit')
          .setURL(`https://arbiscan.io/tx/${event.transactionHash}`)
          .setTimestamp(new Date())
          .addFields([
            { name: 'Account', value: from },
            { name: 'Amount', value: `${ethers.utils.formatUnits(value)} ASCEND` },
          ])
        tradingChannel.send({ embeds: [embed] })
        return
      }
      if (from === ASCEND_STAKING) {
        const embed = new MessageEmbed()
          .setColor('#EF4444')
          .setTitle('ASCEND staking withdrawal')
          .setURL(`https://arbiscan.io/tx/${event.transactionHash}`)
          .setTimestamp(new Date())
          .addFields([
            { name: 'Account', value: to },
            { name: 'Amount', value: `${ethers.utils.formatUnits(value)} ASCEND` },
          ])
        tradingChannel.send({ embeds: [embed] })
        return
      }

      //HANDLE REGULAR TRANSFER TX
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

  watchPrice() {
    setInterval(() => {
      axios
        .get(
          'https://api.coingecko.com/api/v3/simple/token_price/arbitrum-one?contract_addresses=0x9e724698051da34994f281bd81c3e7372d1960ae&vs_currencies=usd'
        )
        .then((res) => {
          if (res.status != 200) {
            this._log(`Invalid status returned from coingecko price API call: ${res.status}`)
            return
          }

          this._client.user?.setActivity(
            `ASCEND Price: $${res.data['0x9e724698051da34994f281bd81c3e7372d1960ae'].usd
              .toPrecision(3)
              .toString()}`,
            {
              type: 'WATCHING',
            }
          )
        })
        .catch((err) => {
          this._log(`Failed to fetch ASCEND price from coingecko API: ${err}`)
          return
        })
    }, 60000)
  }
}
