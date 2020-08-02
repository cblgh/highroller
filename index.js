var CabalBot = require('cabal-bot-core')
var pipeline = require('cabal-bot-pipeline')

// const bot = new CabalBot('kuso', { channels: ['bots'] })
const bot = new CabalBot('kuso', { channels: ['bots'], clientOpts: { config: { temp: false, dbdir: "./logs" }}})

let initiated = false
let maxRollers = null
let rollers // map <roller id>: <their roll>

// todo: pipeline should only match longest command sequence !!
pipeline(bot).onCommand('roll').onCommand("initiate").do((text, cabal, envelope) => {
    let response 
    maxRollers = parseInt(text)
    if (initiated) { // already started
        response = `a round has already been initiated! it will continue until ${maxRollers} people have rolled. roll with !roll`
    } else if (maxRollers > Object.keys(cabal.getUsers()).length) { // # rollers too large
        response = "nooo that is way too many people, try a smaller number of rollers pls!"
    } else { // let's get to it!
        if (isNaN(maxRollers)) {  // not valid # of rollers, choose random
            response = "no # of rollers submitted, choosing a random number of rollers.."
            maxRollers = Math.min(Math.floor(Math.random() * 10 + 1), Object.keys(cabal.getUsers()).length)
            bot.post(cabal, envelope.channel, response)
        }
        response = "allllllright folx get yr rolls in! type !roll to roll, highest roller wins"
        initiated = true
        rollers = new Map()
    }
    console.log(response)
    bot.post(cabal, envelope.channel, response)
})

pipeline(bot).onCommand('roll').onCommand("help").do((text, cabal, envelope) => {
    let commands = []
    commands.push("!roll help:  display this help")
    commands.push("!roll initiate <number of roller>:  start a new roll")
    commands.push("!roll remaining:  get the number of rollers remaining until the final results roll out")
    commands.push("!roll fuckit:  decide a winner based on the current rollers")
    commands.push("!roll:  perform a roll")
    commands.forEach(cmd => bot.post(cabal, envelope.channel, cmd))
})

function declareWinner () {
    let highroller // { roll, key }
    rollers.forEach((roll, key) => { 
        if (!highroller) { highroller = { roll, key }} 
        if (roll > highroller.roll) { highroller = { roll, key }}
    })
    const winner = cabal.getUsers()[highroller.key]
    response = `${winner.name ? winner.name : winner.key.slice(0, 8)} won with ${highroller.roll}${"!".repeat(Math.floor(Math.random() * 7 + 1))}`
    bot.post(cabal, envelope.channel, response)
    reset()
}

pipeline(bot).onCommand('roll').onCommand("fuckit").do((text, cabal, envelope) => {
    if (!initiated) {
        response = "initiate a new round with !roll initiate <number of rollers>"
        return bot.post(cabal, envelope.channel, response)
    }
    declareWinner()
})

pipeline(bot).onCommand('roll').onCommand("remaining").do((text, cabal, envelope) => {
    if (!initiated) {
        response = "initiate a new round with !roll initiate <number of rollers>"
    } else {
        const rolls = maxRollers - rollers.size
        response = `${rolls} ${rolls === 1 ? 'roll' : 'rolls'} until the final results`
    }
    bot.post(cabal, envelope.channel, response)
})

pipeline(bot).onCommand('roll').do((text, cabal, envelope) => {
    if (text.includes("initiate")) { return }
    if (text.includes("remaining")) { return }
    if (text.includes("help")) { return }
    let response
    const name = envelope.author.name ? envelope.author.name : envelope.author.key.slice(0, 8)
    console.log(name, text)
    if (!initiated) {
        response = "initiate a new round with !roll initiate <number of rollers>"
        return bot.post(cabal, envelope.channel, response)
    }
    if (rollers.has(envelope.author.key)) { 
        response = `${name} you already rolled..`
        return bot.post(cabal, envelope.channel, response)
    }
    const roll = Math.floor(Math.random() * 101)
    response = `${name} rolled ${roll}` 
    rollers.set(envelope.author.key, roll)
    bot.post(cabal, envelope.channel, response)
    if (rollers.size >= maxRollers) {  
        declareWinner()
    }
})

function reset () {
    initiated = false
    rollers = null
    maxRollers = null
}

if (process.argv.length < 3) {
    console.log("bot: please give me a cabal:// key to join")
    process.exit()
}
bot.joinCabal(process.argv[2])
