// author's note is constant
state.memory.authorsNote = `This is an erotic story. It sensual and slow. I describe how things look and feel in great detail. Pokemon can't speak. Pokemon can't talk.`

if (state.memory.authorsNote.length > 150) {
	console.log("AUTHORS NOTE TOO LONG!")
}

// util functions
function cap(str) {
	return str.substr(0, 1).toUpperCase() + str.substr(1)
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min) + 0.5)
}

var entry_index_cache = []
worldEntries.forEach(function(data, index) {
	entry_index_cache[data.keys] = index
})

function save(key, value) {
	if (!entry_index_cache[key]) {
		addWorldEntry(key, value, false)
		entry_index_cache[key] = worldEntries.length-1
	}

	updateWorldEntry(entry_index_cache[key], key, value, false)
}

function load(key) {
	if (entry_index_cache[key]) {
		return worldEntries[entry_index_cache[key]].entry
	}
}

function add_you(str) {
	var existing = load("you")
	if (existing) {
		save("you", existing + " " + str)
	} else {
		save("you", str)
	}
}

var memory_context = ``
var memory_context_temp = []
function add_context(str) {
	memory_context = memory_context + "\n\n" + process_tags(str)
	get_context()
}
function add_temp_context(lifetime, str) {
	memory_context_temp.push({
		remaining_turns: lifetime,
		str: process_tags(str)
	})
	get_context()
}
function get_context() {
	var str = memory_context
	memory_context_temp.forEach(function(v, i) {
		str = str + '\n\n' + v.str
	})
	if (str.length > 2000) {
		console.log("MEMORY CONTEXT TOO LONG!")
	}
	state.memory.context = str
	return str
}
function tick_context() {
	var remove = []
	memory_context_temp.forEach(function(v, i) {
		v.remaining_turns--

		if (v.remaining_turns <= 0) {
			remove.push(v)
		}
	})
	remove.forEach(function(v) {
		memory_context_temp.splice(memory_context_temp.indexOf(v), 1)
	})
}

function isMale(g) {
	return g == "boy" || g == "guy" || g == "man" || g == "male" || g == "him" || g == "his" || g == "he" || g == "m" || g == "dickgirl" || g == "futa" || g == "futanari" || g == "shemale" || g == "trans_girl" || g == "gynomorph" || g == "herm" || g == "ladyboy" || g == "hermaphrodite"
}
function isFemale(g) {
	return g == "she" || g == "her" || g == "woman" || g == "female" || g == "girl" || g == "gal" || g == "f" || g == "cuntboy" || g == "lady" || g == "andromorph" || g == "herm" || g == "hermaphrodite"
}

function replaceAll(str, a, b) {
	while (true) {
		var index = str.indexOf(a)
		if (index > -1) {
			str = str.substr(0, index) + b + str.substr(index+a.length)
		} else {
			break
		}
	}
	return str
}
function replaceAllDynamic(str, a, f) {
	while (true) {
		var index = str.indexOf(a)
		if (index > -1) {
			str = str.substr(0, index) + f() + str.substr(index+a.length)
		} else {
			break
		}
	}
	return str
}

function getDickSlang(data, plural) {
	var dick_slang = cockSizes.get(data.cockSize).slang

	if (data.dick_plural || plural) {
		dick_slang = dick_slang + "_plural"
	}

	return dick_slang
}
function getPussySlang(data, plural) {
	if (data.pussy_plural || plural) {
		return "pussy_slang_plural"
	}
	return "pussy_slang"
}

function dCockType(data) {
	return adj("dick_"+data.dick)
}
function dCockSize(data) {
	return adj("dick_"+data.cockSize)
}
function dCock(data) {
	if (data.cockSize != "medium") {
		return dCockSize(data) + " " + dCockType(data)
	} else {
		return dCockType(data)
	}
}
function dPussy(data) {
	return adj("pussy_"+data.pussy)
}
function dSkin(data) {
	return adj("pretty") + " " + adj(data.bodyColor) + " " + adj("skintype_"+data.skinType)
}
function dBody(data) {
	return adj("bodysize_"+data.bodySize) + " " + adj(data.bodyColor) + " " + adj("body_"+data.body)
}
function dGender(word) {
	var m = isMale(word)
	var f = isFemale(word)
	return m ? (f ? "hermaphrodite" : "male") : f ? "female" : adj("pretty")
}

function an(word, cap) {
	var char = word.substr(0, 1).toLowerCase()
	if (char == "a" || char == "e" || char == "i" || char == "o" || char == "u") {
		return cap ? "An" : "an"
	}
	return cap ? "A" : "a"
}

function stop_ai() {
	save("STOP_FROM_CONTEXT", "1")
}

function getRandomKey(collection) {
    let index = Math.floor(Math.random() * collection.size);
    let cntr = 0;
    for (let key of collection.keys()) {
        if (cntr++ === index) {
            return key;
        }
    }
}

///////////////////
// TAG FUNCTIONS //
///////////////////
// tags are inserted into input text to embed high level function calls
const tagFunctions = new Map()

function process_tags(text) {
	var modifiedText = text
	var lowered = modifiedText.toLowerCase()
	var parsedSomething = true
	var searchSub = lowered
	var searchSubOffset = 0
	while (parsedSomething) {
		parsedSomething = false
		
		var tagStart = searchSub.search("/")
		var commandLength = 0
		if (tagStart != -1) {
			// found a tag
			searchSub = searchSub.substr(tagStart+1)
			var lookingForArgs = 0
			var foundKey = false
			var args = []
			var func = {}
			var terminator = " "
			commandLength = commandLength + 1
			
			while ((foundKey == false || lookingForArgs > args.length) && searchSub.length > 0) {
				// collect args
				nextSpace = -1
				adj_acceptible_trails.forEach(function(char) {
					var index = searchSub.search("\\"+char)
					if (nextSpace == -1 || (index >= 0 && index < nextSpace)) {
						nextSpace = index
						terminator = char
					}
				})

				word = ""
				if (nextSpace == -1) {
					word = searchSub
					commandLength = commandLength + searchSub.length
					searchSub = ""
				} else {
					word = searchSub.substr(0, nextSpace)
					searchSub = searchSub.substr(nextSpace+1)
					commandLength = commandLength + nextSpace + 1
				}
				
				if (!foundKey) {
					key = word
					func = tagFunctions.get(key)
					foundKey = true
					if (func && func.args) {
						lookingForArgs = func.args
					}
				} else {
					args[args.length] = word
				}
			}
			if (searchSub.length > 0) {
				commandLength = commandLength - 1
				searchSub = " " + searchSub
			}
			
			// call func
			if (func) {
				response = func.call(args)
				// inject
				modifiedText = modifiedText.substr(0, tagStart + searchSubOffset) + response + modifiedText.substr(tagStart + searchSubOffset + commandLength)
				searchSub = response + searchSub
				searchSubOffset = modifiedText.length - searchSub.length
				parsedSomething = true
				
				if (key == "help") {
					stop_ai()
					break // don't re-parse the commands in the help menu
				}
			}
		}
	}

	return modifiedText
}

// Adjectives
// /a [key] 
var adjectives = new Map()
var adj_acceptible_trails = [".", ",", "?", "!", ":", " ", "\n", "-"]
function adj(word) {
	var trail = ""
	while (true) {
		var char = word.substr(word.length-1)
		if (adj_acceptible_trails.find(x => x == char)) {
			word = word.substr(0, word.length-1)
			trail = char + trail
		} else {
			break
		}
	}

	list = adjectives.get(word)
	if (list) {
		return list[rand(0, list.length-1)] + trail
	}
	return ("NO ADJECTIVE FOUND FOR INPUT: (" + word + ")")
}
tagFunctions.set("a", {
	args: 1,
	call: function(args) {
		return adj(args[0])
	}
})

// Gendered pronoun
// /gp [m | f | t] [0 | 1 | 2 | 3]
tagFunctions.set("gp", {
	args: 2,
	call: function(args) {
		return args[0] == "m" ? (
			args[1] == 0 ? "he" : args[1] == 1 ? "his" : args[1] == 2 ? "he's" : "his"
		) : args[0] == "f" ? (
			args[1] == 0 ? "she" : args[1] == 1 ? "her" : args[1] == 2 ? "she's" : "hers"
		) : (
			args[1] == 0 ? "it" : args[1] == 1 ? "its" : args[1] == 2 ? "it's" : "its"
		)
	}
})

// Debug world data
// /dbw [key]
// /dbw all
tagFunctions.set("dbw", { // debug dump world info for a specific key
	args: 1,
	call: function(args) {
		if (args[0] == "all") {
			console.log(worldEntries)
			return "dumped world entries"
		}

		for (i=0; i<worldEntries.length; i++) {
			if (args[0] == worldEntries[i].keys) {
				return worldEntries[i].entry
			}
		}
		return "not found"
	}
})

////////////
// SCENES //
////////////
var scenes = new Map()

scenes.set("test", {
	hidden: true,
	actors: [
		{
			type: "pokemon",
			key: "a",
			name: "the pokemon"
		}
	],
	build: function(v) {
		return JSON.stringify(v.a)
	}
})

scenes.set("rand", {
	hidden: true,
	actors: [
		{
			type: "pokemon",
			key: "a",
			name: "the pokemon"
		}
	],
	build: function(v) {
		return JSON.stringify(v.a.randomOptions)
	}
})

scenes.set("gangrape", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "the pokemon gang"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`You've always secretly wanted to be gang raped by a group of ${a.g("male","female","sexy")} ${a.name_lower_p}. You're a bit of a slut and you love being taken advantage of. You love ${a.g("male","female","sexy")} ${a.name_lower_p} in particular because you'd love to ${p.g("be fucked by their", "fuck their")} ${a.g(a.dCock(true),a.dPussy(true),"sexy bodies")}`)

		// string
		var str = `You're a great-looking ${p.gender_word}.

You were out and about adventuring when suddenly you lost consciousness!

You awaken to see an entire herd of ${a.dBody()} pokemon with ${a.dSkin()} looking at you. It's a heard of ${a.name_lower_p}! You've heard stories about this group knocking trainers out and gang raping them, but you didn't think they were true! They're all ${a.g("male","female","looking at you")}, and clearly aroused. Each one of them has ${a.his} ${a.g(a.dCock(),a.dPussy(),"body")} on full display, and they look like these ${a.gender_word} ${a.name_word_p} are about to take what they want by force.

A couple ${a.name_lower_p} walk over to you. You can't take your eyes off their ${a.g(a.dCock(true),a.dPussy(true),"sexy bodies")}. They rip your clothes off and `
		
		return str
	}
})

scenes.set("milking", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "the pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`Your job is to milk ${a.name_lower_plural}' ${a.g(a.dCock(true), "breasts", "bodies")} and collect the resulting ${a.g("semen", "milk", "fluids")} in buckets. If you drink or waste the ${a.name_lower} ${a.g("cum", "milk", "fluid")} instead of collecting it in a bucket, your supervisor will get mad at you. You've always loved milking ${a.name_lower_p}' ${a.g(a.dCock(), "soft breasts", "sexy bodies")}. Your preferred style of ${a.g("penis milking", "milking", "milking")} is slow and sensual. You focus on the sensations and make the ${a.name_lower} feel really good. The ${a.name_lower}'s happiness is your reward. You love watching the ${a.name_lower}'s ${a.g("cum", "milk", "fluids")} shoot into the bucket. You're a professional, so you always collect the ${a.name_lower}'s ${a.g("cum", "milk", "fluids")} in the bucket.`)

		if (a.m) {
			add_context(`"Milking" refers to penis milking. ${a.name} penises are milked to retrieve their semen so it can be packaged and sold.`)
		}

		// string
		var str = `You work at the MooMoo Milk factory where you spend all day milking ${an(a.name_lower)} ${a.name_lower}'s ${a.g(a.dCock(), "supple breasts", "sexy body")}.

At MooMoo Milk they want each milker to figure out a milking style that works best for them. Your preferred style is slow and sensual, you just love pleasuring the ${a.name_lower}. Like every day, your supervisor leads you to a pen where she opens the door. You see a ${a.g("male", "female", "/a pretty")} ${a.name_lower} before you. "Remember, more ${a.g("cum", "milk", "juice")} means more pay." Your supervisor gives you a wink and closes the door, leaving you alone with the ${a.name_lower}.

On the wall are several buckets. Your goal is to fill those buckets with as much ${a.name_lower} ${a.g("cum", "milk", "fluid")} as possible. You grab a bucket and put it in front of the ${a.name_lower}. ${a.He} looks ${a.g("extremely pent up", "uncomfortably full of milk", "ready to go")}, ${a.he} must not have been milked for a while. ${a.Hes} clearly expecting you to start doing something, and you're more than happy to oblige. You gesture for the /a pretty ${a.name_lower} to come over to you.`

		if (a.m) {
			str = str + ` He knows the drill. He positions his completely flaccid ${a.dCock()} in front of you. Since his ${a.dCock()} ${a.pg ? "are" : "is"} totally flaccid you'll have to warm him up before you can collect his cum.`
		} else if (a.f) {
			str = str + ` She knows the drill. She positions her supple breasts in front of you.`
		}

		str = str + " You can't wait to get started."

		return str
	}
})

scenes.set("legendary", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "the pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`You are a ${p.gender_word} pokemon trainer. You are looking for a rare ${a.g("male","female","legendary")} ${a.name_lower}. The ${a.name_lower} can speak telepathically. You can hear ${a.his} voice in your head when ${a.he} wants to speak to you. ${a.name} is a powerful ${a.g("male","female","legendary")} pokemon and ${a.hes} extremely horny. ${a.name} hasn't had an orgasm in a long time, and ${a.he} needs you to make ${a.him} cum. ${a.name} knows ${a.hes} extremely sexy and you'd be honored to service ${a.him}. ${a.name} will tell you how to pleasure ${a.him}. ${a.name} will tell you exactly what ${a.he} likes and how to make ${a.him} cum. ${a.name} will tell you every step to bringing ${a.him} to orgasm. ${a.name} wants you to make ${a.him} cum over and over. ${a.name} talks a lot, and ${a.he} is a very vocal lover. No matter how much ${a.name} cums ${a.he} will never be satisfied. ${a.name} wants you to continue pleasing ${a.him} forever.`)

		if (a.m) {
			add_context(`Since ${a.name_lower} is so backed up, he will cum ten times as much as normal. His cum will make a huge mess.`)
		}

		// string
		var str = `You've been looking into reports of a telepathic ${a.g("male","female","horny")} ${a.name_lower}. You've tracked the reports to a pokemon den outside of town, where you hear moaning coming from within the den.

You go into the den, and there you see ${a.him}: a ${a.name_lower} trying fruitlessly to masturbate ${a.his} ${a.g(a.dCock(),a.dPussy(),"body")}. ${a.He} notices you and stops. The ${a.name_lower} looks at you, and you hear ${a.his} voice in your head.

"Trainer, I need your help. Forgive my forwardness, but I've been pent up for so long. I simply can't reach orgasm on my own. I need you to masturbate my ${a.g(a.dCock(),a.dPussy(),"body")} and relieve me. Please."

You take pity on the helplessly horny ${a.name_lower} and take your clothes off. Again you hear ${a.his} voice in your head. "Oh, thank you. Please hurry. I need to cum.". You walk over to the lust-stricken ${a.name_lower} and look over ${a.his} ${a.g(a.dCock(),a.dPussy(),"body")}. ${a.He} positions ${a.himself} so that you can service ${a.his} ${a.g(a.dCock(),a.dPussy(),"body")}.

"I'm ready for you, trainer."

${a.His} ${a.g(a.dCock(),a.dPussy(),"body")} ${a.pg ? "twitch" : "twitches"} in anticipation.`

		return str
	}
})

scenes.set("breeder", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "the first pokemon"
		},
		{
			type: "pokemon",
			key: "b",
			name: "the second pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a
		var b = v.b

		// context
		add_context("You are a pokemon breeder")

		add_context(`You are a ${p.gender_word} pokemon trainer. You are looking for a rare ${a.g("male","female","legendary")} ${a.name_lower}. The ${a.name_lower} can speak telepathically. You can hear ${a.g("his","her","its")} voice in your head when it wants to speak to you. ${a.name} is a powerful ${a.g("male","female","legendary")} pokemon and ${a.g("he's","she's","it's")} extremely horny. ${a.name} hasn't had an orgasm in a long time, and ${a.g("he","she","it")} needs you to make ${a.g("him","her","it")} cum. ${a.name} knows ${a.g("he's","she's","it's")} extremely sexy and you'd be honored to service ${a.g("him","her","it")}. The ${a.name_lower} will tell you how to pleasure ${a.g("him","her","it")}. ${a.name} will tell you all about exactly what ${a.g("he","she","it")} likes and how to make ${a.g("him","her","it")} cum. ${a.name} will tell you every step to bringing ${a.g("him","her","it")} to orgasm. ${a.name} wants you to make ${a.g("him","her","it")} cum over and over. ${a.name} talks a lot, and ${a.g("he","she","it")} is a very vocal lover.`)

		if (a.m) {
			add_context(`Since ${a.name_lower} is so backed up, he will cum ten times as much as normal. His cum will make a huge mess.`)
		}

		// string
		var str = `You've been looking into reports of a telepathic ${a.g("male","female","horny")} ${a.name_lower}. You've tracked the reports to a pokemon den outside of town, where you hear moaning coming from within the den.

You go into the den, and there you see ${a.g("him","her","it")}: a ${a.name_lower} trying fruitlessly to masturbate ${a.g("his","her","its")} ${a.g(a.dCock(),a.dPussy(),"body")}. ${a.g("He","She","It")} notices you and stops. The ${a.name_lower} looks at you, and you hear ${a.g("his","her","its")} voice in your head.

"Trainer, I need your help. Forgive my forwardness, but I've been pent up for so long. I simply can't reach orgasm on my own. I need you to masturbate my ${a.g(a.dCock(),a.dPussy(),"body")} and relieve me. Please."

You take pity on the helplessly horny ${a.name_lower} and take your clothes off. Again you hear ${a.g("his","her","its")} voice in your head. "Oh, thank you. Please hurry. I need to cum.". You walk over to the lust-stricken ${a.name_lower} and look over ${a.g("his","her","its")} ${a.g(a.dCock(),a.dPussy(),"body")}. ${a.g("He","She","It")} positions ${a.g("himself","herself","itself")} so that you can service ${a.m && a.dick.plural ? "them" : a.f && a.pussy.plural ? "them" : "it"}.

"I'm ready for you, trainer."

${a.g("His","Her","Its")} ${a.g(a.dCock(),a.dPussy(),"body")} ${a.m && a.dick.plural ? "twitch" : a.f && a.pussy.plural ? "twitch" : "twitches"} in anticipation.`

		return str
	}
})

scenes.set("cuck_sub", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your pokemon"
		},
		{
			type: "person",
			key: "t",
			name: "the other trainer"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a
		var t = v.t

		// context
		add_you(`You're awful at sex and you can never make your ${a.name_lower} cum. You wish your ${a.name_lower} would fuck someone else to reach orgasm since you're unable to make ${a.her} cum.`)
		add_context(`Everyone knows you have a ${p.g("tiny dick", "ugly pussy", "ugly body")}. Everyone thinks you're a loser. You're terrible at sex. You can never make your ${a.name_lower} cum, and your ${a.name_lower} hates you for it. Your ${a.name_lower} is desperate for good sex, and ${a.she} despises you for your inability to make ${a.her} cum.`)

		// string
		var str = `You're a ${p.gender_word}.

You thought you were a good pokemon trainer, but you're not so sure anymore. You fuck your ${a.name_lower} as well as you can but ${a.she} often seems disinterested, or even bored. It's been a while since you could make ${a.her} cum. Maybe ${a.she} just isn't attracted to you...

Oh, well. Maybe it can't be helped. Besides, you just lost another pokemon battle. It was humiliating but rules and rules, you have to pay the other trainer for the battle. You open your wallet and realize it's empty! You've been losing so much money recently that you're completely broke!

You tell the other trainer you don't have the cash. ${t.He} thinks for a moment and then an mischievous grin comes over ${t.his} face.

"If you don't have the cash, I'll just have to take my payment another way!" ${t.He} grabs your pokeball out of your hand and shoves you back. "Don't think I didn't see how pent up your ${a.name_lower} is. I bet you haven't given ${a.her} a good fuck in a long time. I'm gonna change that."

The trainer takes off their clothes, revealing ${t.g("his massive cock", "her perfectly plump pussy", "their perfectly toned body")}.`

		if (t.m) {
			if (p.m) {
				str = str + ` His cock is easily twice as long as your pathetic dick, and way thicker too! It's bigger than any human dick you've ever seen. He looks at you with a confident smirk, he knows his dick is way bigger than yours.`
			} else {
				str = str + ` His cock is bigger than any human dick you've ever seen.`
			}
		} else if (t.f) {
			if (p.f) {
				str = str + ` Her pussy is so much prettier than yours ugly roast beef pussy. It looks tighter and slicker too. She looks at you with a confident smirk. She knows her pussy is perfect, and way prettier than yours.`
			}
			str = str + ` She has the prettiest, tightest-looking pussy you've ever seen.`
		} else {
			str = str + ` The trainer's body is muscular and beautiful.`
		}

		str = str + `\n\nThe trainer releases your ${a.name_lower} from ${a.her} pokeball. Your ${a.name_lower} immediately locks eyes with the sexy trainer. In fact you're not sure if your ${a.name_lower} even notices you at all, as ${a.her} eyes scan down to the trainer's ${t.g("massive cock", "perfect pussy", "groin")}.

Your ${a.name_lower} hasn't had an orgasm in so long. You just know ${a.she} hates your ${p.g("pathetic dick", "ugly pussy", "ugly body")}, and with this sexy trainer in front of ${a.her} ${a.shes} not going to waste the opportunity. You see the way ${a.shes} looking at ${t.him}. ${a.She} has never looked at you that way.`

		if (a.m) {
			str = str + ` Your ${a.name_lower}'s ${a.dCock()} ${a.dick.plural ? "are" : "is"} already twitching and spurting precum in anticipation. You can't even remember the last time you made him hard. `
		} else if (a.f) {
			str = str + ` Your ${a.name_lower}'s ${a.dPussy()} juices are already leaking down her body. You can't even remember the last time you made her wet. `
		}

		str = str + `${a.name} begins moving toward the alpha ${t.g("male","female","trainer")} standing before ${a.her}.`
		
		return str
	}
})

scenes.set("battle_rape", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your pokemon"
		},
		{
			type: "pokemon",
			key: "b",
			name: "the other pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a
		var b = v.b

		// context
		add_context(`You love your ${a.name_lower} more than anything, but you could never protect ${a.her} from another pokemon. Your ${a.name_lower} loves you, but ${a.she} hates your ${p.g("tiny dick", "ugly pussy", "ugly body")}. You're terrible at sex, so anyone else having sex with your ${a.name_lower} would make ${a.her} orgasm nonstop. ${a.name} loves you, but ${a.she} has sexual needs that you aren't fulfilling.`)

		// string
		var str = `You're a ${p.gender_word} human, and you just lost a battle against a wild ${b.g("male","female","sexy")} ${b.name_lower}. Your ${a.name_lower} is exhausted and ${a.shes} too weak to fight anymore, but the wild ${b.name_lower} isn't satisfied yet.

${b.He} goes over to you and knocks your pokeball out of your hand, breaking it. You can't call your ${a.name_lower} back anymore! The wild ${b.name_lower} heads over to your weakened ${a.name_lower}, and you notice the ${b.name_lower}'s`
			
		if (b.m) {
			str = str + ` ${b.dCock()} ${b.pg ? "are" : "is"} fully erect, and dripping precum.`
		} else if (b.f) {
			str = str + ` ${b.dPussy()} ${b.pg ? "are" : "is"} leaking juices all down her body.`
		} else {
			str = str + ` body is aroused as hell.`
		}

		str = str + `\n\nYour ${a.name_lower} makes an attempt to escape, but ${a.shes} so weak ${a.she} can barely move. The ${b.name_lower} stops for a moment and looks back at you, making sure to display ${b.his} ${b.g(b.dCock(), b.dPussy(), "sexy body")}. ${b.He} must think it's amusing how helpless you are to stop your ${a.name_lower}'s ${a.g(a.dCock(), a.dPussy(), "body")}. from being violated by ${b.his} ${b.g(b.dCock(), b.dPussy(), "body")}. Then you notice your ${a.name_lower}'s ${a.g(a.dCock(),a.dPussy(),"body")} ${a.pg ? "are" : "is"} ${a.g("fully erect","soaking wet","fully aroused")}. Is ${a.she} liking this?

Suddenly your suspicions are confirmed, as your ${a.name_lower}`

		return str
	}
})

scenes.set("cuck_dom", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your target"
		},
		{
			type: "person",
			key: "t"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a
		var t = v.t

		// context
		add_context(`You have a ${p.m ? "huge cock" : p.f ? "perfect pussy" : "sexy body"} and you know it. You have no problems making pokemon cum. Pokemon practically beg you to fuck them. Other trainers wish they were as good at sex as you are.`)

		// string
		var str = `You're a great-looking ${p.gender_word}. You just won a battle, but the loser doesn't have the cash to pay up! You think for a moment, and then you realize that loser trainer had a pretty sexy ${a.name_lower}, and ${a.m ? "he" : a.f ? "she" : "it"} looks like ${a.m ? "he" : a.f ? "she" : "it"} hasn't had an orgasm in forever.

You walk over to the loser and take ${t.m ? "his" : t.f ? "her" : "their"} pokeball. You know ${t.m ? "he has a tiny dick" : t.f ? "she has an ugly pussy" : "they have an ugly body"} and you're gonna show ${t.m ? "his" : t.f ? "her" : "their"} ${a.name_lower} what ${a.m ? "he's" : a.f ? "she's" : "it's"} missing out on. You take off your pants, revealing your ${p.m ? "massive cock" : p.f ? "perfect pussy" : "sexy body"}, and release the ${a.name_lower} from ${a.m ? "his" : a.f ? "her" : "its"} pokeball.

The ${a.name_lower} notices you right away, and ${a.m ? "his" : a.f ? "her" : "its"} eyes dart straight to your ${p.m ? "huge cock" : p.f ? "tight pussy" : "toned body"}. ${a.m ? "He" : a.f ? "She" : "It"} knows what you want, and ${a.m ? "he" : a.f ? "she" : "it"}'s desperate for an orgasm. You're suspicions are correct: that loser trainer hasn't made ${a.name_lower} cum in a long time.

You look over the ${a.name_lower}, paying attention to ${a.m ? "his" : a.f ? "her" : "its"} ${a.m ? a.dCock() : a.f ? a.dPussy() : "body"}. ${a.m ? "He's" : a.f ? "She's" : "It's"} sexy as hell, and you're going to show ${a.m ? "him" : a.f ? "her" : "it"} what a real ${p.m ? "man" : p.f ? "woman" : "trainer"} can do.

The ${a.name_lower}`
		
		return str
	}
})

scenes.set("starter", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`It's your 18th birthday. When a pokemon trainer turns 18, they receive their first pokemon from Professor Cherry. Cherry gave you a ${a.g("male","female","sexy")} ${a.name_lower}, but you have to tame it first. To tame a ${a.name_lower} you have to make ${a.him} cum. Once you make ${a.him} cum ${a.he} will be your pokemon forever. You really want to make your new ${a.name_lower} cum so ${a.hell} be your pokemon. You also really want to explore every inch of ${a.his} body and pay species attention to ${a.his} ${a.g(a.dCock(),a.dPussy(),"genitals")}.`)

		// string
		var str = `You're a great-looking ${p.gender_word}. It's your 18th birthday and Professor Cherry gave you your first pokemon! She told you it's a ${a.g("male","female","sexy")} ${a.name_lower}. She also reminded you that you have to make ${a.him} cum.

That's right, a pokemon will only become your partner if you make them cum. ${a.name} is no exception. You did a bunch of research about ${a.name_lower_p} and their ${a.g(a.dCock(),a.dPussy(),"sexual behavior")}, so you're pretty confident about your ability to bring your ${a.name_lower} to orgasm.

It's nighttime and you're in your bedroom. You dim the lights, set the mood, and undress. You sit on the edge of your bed completely nude and look at the ${a.name_lower}'s pokeball. You're about to meet your new ${a.name_lower}, and you're gonna meet ${a.his} ${a.g(a.dCock(),a.dPussy(),"genitalia")}. You click the pokeball and a beam of light jumps out of the pokeball and takes the form of `

		// describe
		str = str + `a ${a.dBody()} pokemon with ${a.dSkin()}. ${a.Hes} clearly ${a.g("male","female","excited")}, as evidenced by ${a.his} ${a.g(a.dCock(),a.dPussy(),"obvious arousal")}. Your new ${a.name_lower} looks at you with curiosity. It seems ${a.he} knows what you want, as`

		if (a.m) {
			str = str + ` his ${a.dCock()} ${a.pg ? "are" : "is"} already beginning to harden. He must be excited for what's about to happen.`

			if (p.f) {
				str = str + ` You lay back on the bed and spread your legs, showing him your moist pussy. You spread it a bit so your ${a.name_lower} can clearly see that you want his ${a.dCock()} inside you.`
			} else if (p.m) {
				str = str + ` You grab your own cock and shake it at him in a crude display of desire. The ${a.name_lower} is clearly interested, his ${a.dCock()} now leaking precum onto the floor.`
			} else {
				str = str + ` You present yourself to him and tease him with your body. You can tell your ${a.name_lower} is getting excited by his ${a.dCock()} dripping precum onto the floor.`
			}
		} else if (a.f) {
			str = str + ` her ${a.dPussy()} juices are already dripping down her leg. She must be excited for what's about to happen.`
			
			if (p.m) {
				str = str + ` You grab your cock and shake it at her in a crude display of primal desire. Your ${a.name_lower} is clearly interested, and she moves in closer.`
			} else if (p.f) {
				str = str + ` You spread yourself and rub your labia in a display of raw desire. Your ${a.name_lower} notices and moves in closer.`
			} else {
				str = str + ` You present yourself, dislpaying your unabashed need to the already-soaking ${a.name_lower}. She can't wait any more than you can at this point.`
			}
		} else {
			if (p.m) {
				str = str + ` you grab your cock and shake it at it in a crude display of primal desire. Your ${a.name_lower} is clearly interested, and it moves in closer.`
			} else if (p.f) {
				str = str + ` you spread yourself and rub your labia in a display of raw desire. Your ${a.name_lower} notices and moves in closer.`
			} else {
				str = str + ` you present yourself, dislpaying your unabashed need to the already-horny ${a.name_lower}. It can't wait any more than you can at this point.`
			}
		}

		str = str + `\n\nYou're nervous. You've never fucked a pokemon before. Luckily it looks like your new ${a.name_lower} is taking the lead. ${a.He}`
		
		return str
	}
})

scenes.set("porn_vid", {
	actors: [
		{
			type: "pokemon",
			key: "a",
			name: "the first pokemon"
		},
		{
			type: "pokemon",
			key: "b",
			name: "the second pokemon"
		}
	],
	build: function(v) {
		var str = `It's midnight and you're horny. You decide to take a break from fucking your pokemon and jerk off instead. You turn on the tv and go to one of the hundreds of pokemon porn channels.\n\n`

		var a = v.a
		var b = v.b

		if (a.s == b.s) {
			// same species
			if (a.s.arms) {
				// they have arms
				if (a.m) {
					// males with arms
					str = str + `Two male ${a.name_lower} are jerking each other's ${a.dCock(true)}. Each of the ${a.name_lower_p}' ${a.dCock(true)} are twitching and squirting precum.`
				} else if (a.f) {
					// females with arms
					str = str + `Two female ${a.name_lower_p} are rubbing each other's ${a.dPussy(true)}. The two ${a.name_lower_p}' ${a.dPussy(true)} are soaking wet.`
				} else {
					// genderless with arms
					str = str + `Two ${a.name_lower_p} are getting frisky with each other.`
				}
			} else {
				// no arms
				if (a.m) {
					// males with no arms
					str = str + `The camera shows two male ${a.name_lower_p} with fully-erect ${a.dCock(true)} taking turns sucking each other's ${a.dCock(true)}. Each of the ${a.name_lower_p}' ${a.dCock(true)} are leaking precum and twitching with desire.`
				} else if (a.f) {
					// females with no arms
					str = str + `The camera shows two female ${a.name_lower_p} with soaking wet ${a.dPussy(true)} taking turns licking each other's ${a.dPussy(true)}. The ${a.name_lower_p} faces are soaked with the juices from their ${a.dPussy(true)}.`
				} else {
					// genderless with no arms
					str = str + `The camera shows two ${a.name_lower_p} taking turns doing erotic things to one another.`
				}
			}
		} else {
			if (a.arms) {
				// 1:arms
				if (b.arms) {
					// 1:arms 2:arms
					if (a.m) {
						// 1:arms,male 2:arms
						if (b.f) {
							// 1:arms,male 2:arms,female
							str = str + `A male ${a.name_lower} with a fully-erect ${a.dCock()} is finger-fucking a female ${b.name_lower}'s ${b.dPussy()}. The ${a.name_lower}'s ${a.dCock()} twitches with desire, squirting precum on the ${b.name_lower}'s ${b.dPussy()}.`
						} else {
							// 1:arms,male 2:arms,unknown
							str = str + `A male ${a.name_lower} with a fully-erect ${a.dCock()} is getting frisky with a ${b.name_lower}. The ${a.name_lower}'s ${a.dCock()} is twitching wildly with desire.`
						}
					} else if (a.f) {
						// 1:arms,female 2:arms
						if (b.m) {
							// 1:arms,female 2:arms,male
							str = str + `A female ${a.name_lower} with ${a.pg ? "some" : "a"} soaking-wet ${a.dPussy()} is jerking off a male ${b.name_lower}'s ${b.dCock()}. The ${b.name_lower}'s ${b.dCock()} is squirting precum and twitching wildly as the ${a.name_lower} strokes it.`
						} else {
							// 1:arms,female 2:arms,unknown
							str = str + `A female ${a.name_lower} with ${a.pg ? "some" : "a"} soaking-wet ${a.dPussy()} is getting frisky with a ${b.name_lower}. The ${a.name_lower}'s ${a.dPussy()} ${a.pg ? "are" : "is"} plump and blushing.`
						}
					} else {
						// 1:arms,unknown
						if (a.m) {
							// 1:arms,unknown 2:arms,male
							str = str + `A ${a.name_lower} is getting frisky with a male ${b.name_lower}. The ${b.name_lower}'s ${b.dCock()} is already rock hard.`
						} else {
							// 1:arms,unknown 2:arms,female
							str = str + `A ${a.name_lower} is getting frisky with a female ${b.name_lower}. The ${b.name_lower}'s ${b.dPussy()} ${a.pg ? "are" : "is"} already soaking wet.`
						}
					}
				} else {
					// 1:arms 2:noarms
					if (a.m) {
						// 1:arms,male 2:noarms
						if (b.f) {
							// 1:arms,male 2:noarms,female
							str = str + `A male ${a.name_lower} is poking his ${a.dCock()} into a female ${b.name_lower}'s ${b.dPussy()}.`
						} else {
							// 1:arms,male 2:noarms,unknown
							str = str + `A male ${a.name_lower} has his hard ${a.dCock()} against the a ${b.name_lower}'s mouth.`
						}
					} else if (a.f) {
						// 1:arms,female 2:noarms
						if (b.m) {
							// 1:arms,female 2:noarms,male
							str = str + `A female ${a.name_lower} is rubbing her ${a.dPussy()} playing with a male ${b.name_lower}'s ${b.dCock()}.`
						} else {
							// 1:arms,female 2:noarms,unknown
							str = str + `A female ${a.name_lower} is rubbing her ${dPussy()} against a ${b.name_lower}'s face.`
						}
					}
				}
			} else {
				// 1:noarms
				if (b.arms) {
					// 1:noarms 2:arms
					if (a.m) {
						// 1:noarms,male 2:arms
						if (b.f) {
							// 1:noarms,male 2:arms,female
							str = str + `A male ${a.name_lower} is licking a female ${b.name_lower}'s ${b.dPussy()}. The ${a.name_lower}'s ${a.dCock()} twitches, squirting precum on the ground.`
						} else {
							// 1:noarms,male 2:arms,unknown
							str = str + `A male ${a.name_lower} is rutting a ${b.name_lower}. The ${a.name_lower}'s ${a.dCock()} twitches, squirting precum on the ground.`
						}
					} else if (a.f) {
						// 1:noarms,female 2:arms
						if (b.m) {
							// 1:noarms,female 2:arms,male
							str = str + `A female ${a.name_lower} is sucking a male ${b.name_lower}'s ${b.dCock()}. The ${a.name_lower}'s ${a.dPussy()} juices are dripping down her leg.`
						} else {
							// 1:noarms,female 2:arms,unknown
							str = str + `A female ${a.name_lower} is backing into a ${b.name_lower}. The ${a.name_lower}'s wet ${a.dPussy()} ${a.pg ? "are" : "is"} rubbing right up against the ${b.name_lower}'s body.`
						}
					}
				} else {
					// 1:noarms 2:noarms
					if (a.m) {
						// 1:noarms,male 2:noarms
						if (b.f) {
							// 1:noarms,male 2:noarms,female
							str = str + `A male ${a.name_lower} is sniffing at a female ${b.name_lower}'s ${b.dPussy()}. The ${a.name_lower}'s ${a.dCock()} ${a.pg ? "flex" : "flexes"}, spewing precum on the floor beneath it.`
						} else {
							// 1:noarms,male 2:noarms,unknown
							str = str + `A male ${a.name_lower} is rubbing against a ${b.name_lower}. The ${a.name_lower}'s ${a.dCock()} ${a.pg ? "flex" : "flexes"}, spewing precum on the floor beneath it.`
						}
					} else if (a.f) {
						// 1:noarms,female 2:noarms
						if (b.m) {
							// 1:noarms,female 2:noarms,male
							str = str + `A female ${a.name_lower} is backing her ${a.dPussy()} into a male ${b.name_lower}'s ${b.dCock()}.`
						} else {
							// 1:noarms,female 2:noarms,unknown
							str = str + `A female ${a.name_lower} is backing her ${a.dPussy()} into a ${b.name_lower}.`
						}
					}
				}
			}
		}

		str = str + ` The scene is incredibly erotic. You watch as the `

		return str
	}
})

scenes.set("sex_ed", {
	temp_context: [
		{
			lifetime: 5,
			str: "Professor Cherry wants to teach you all about pokemon genitals and pokemon sexual habits."
		}
	],
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "the pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_you(`You are an 18 year old ${p.gender_word}. You're a virgin and you're fascinated by pokemon sexuality. You love pokemon dicks and pokemon pussies. You wish a pokemon would ${p.g("let you fuck it with your cock","fuck your pussy","fuck you")}.`)
		add_context(`Professor Cherry is teaching a class on ${a.name_lower} sex. Cherry is using her own ${a.name_lower} as an example for the class. You are her star student. She has brought you up for hands-on experience with ${a.name_lower}'s ${a.g(a.dCock(),a.dPussy(),"genitals")}. She will instruct you step by step on bringing the ${a.name_lower} to orgasm. Cherry's ${a.name_lower} is well-trained and very friendly. Cherry is highly knowledgable about ${a.name_lower} sex. Cherry knows exactly how to make ${a.name_lower}'s ${a.g(a.dCock(),a.dPussy(),"genitls")} cum.`)

		// string
		var str = `You're a great-looking ${p.gender_word}.

Professor Cherry is teaching a ten-part course on pokemon sexuality. Cherry is a dark-skinned woman with large breasts and a short red dress under her white lab coat. Professor Cherry is a specialist in pokemon sexuality and she knows all there is to know about sex with pokemon.

You're in the lecture hall listening to Professor Cherry tell the class all about the sexual habits of ${a.name_lower_p}. Cherry takes out a pokeball and activates it. A beam of light leaves the ball and takes the form of `

		// describe
		str = str + `a ${a.dBody()} pokemon with ${a.dSkin()}. ${a.Hes} clearly ${a.g("male","female","excited")}. The class oohs and aahs, and the ${a.name_lower} looks around curiosity. ${a.He} seems well-trained, as ${a.hes} waiting patiently for Cherry to give ${a.him} further instructions.`

		if (a.m) {
			str = str + ` You look between the ${a.name_lower}'s' legs and see his ${a.dCock()} ${a.pg ? "are" : "is"} already beginning to harden. He must know what's about to happen.

Cherry walks over to him and grabs the ${a.name_lower}'s' ${a.dCock()}. She shakes ${a.pg ? "them" : "it"} a little to get him excited, and it's working. You see his ${a.dCock()} beginning to rise.`
		} else if (a.f) {
			str = str + ` You look between her legs and see her ${a.dPussy()} ${a.pg ? "are" : "is"} already blushing. She must know what's about to happen.

Cherry walks over the ${a.name_lower}, puts her hand on ${a.pg ? "one of " : ""}the pokemon's ${a.dPussy()}, and rubs it a little to get her excited.`
		}

		str = str + `\n\nCherry announces to the class, "Here's my ${a.name_lower}. As you can see by ${a.his} ${a.g("hardening","moistening","aroused")} ${a.g(a.dCock(),a.dPussy(),"genitals")}, ${a.he} already knows what we're doing today. I'm going to call on a volunteer." Cherry's eyes scan the room for a moment, then she gestures to you. "Ah, my best student will be perfect for this. Come here. You're getting some hands-on experience today."

You nervously walk up to Cherry and her ${a.name_lower}. The ${a.name_lower} looks at you, and ${a.his} ${a.g(a.dCock(),a.dPussy(),a.body)} twinges. ${a.He} must like you.

"Never fucked a pokemon before?" Cherry laughs "I'll guide you through it, step by step, until this ${a.name_lower} cums ${a.his} brains out. You're going to bring my ${a.name_lower} to orgasm right here, and I'm gonna teach you how to make ${a.his} ${a.m ? a.dCock() : a.f ? a.dPussy() : "body"} spray cum like a geyser."

Cherry licks her lips and begins instructing you. "Now,`
		
		return str
	}
})

scenes.set("starter_rr", {
	actors: [
		{
			type: "pokemon",
			key: "a",
			firstPerson: true,
		},
		{
			type: "person",
			key: "p",
			name: "your trainer"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`You are a ${a.gender_word} ${a.name_lower}. You love fucking humans with your ${a.g(a.dCock(),a.dPussy(),"sexual equipment")}. Your ${a.g(a.dCock(),a.dPussy(),"body")} ${a.pg ? "have" : "has"} never failed to make a human cum. You love letting humans service your ${a.g(a.dCock(),a.dPussy(),"body")}.`)
		add_context(`You were Professor Cherry's ${a.name_lower} for a while. She taught you everything there is to know about sex with humans.`)

		// string
		var str = `You're a great-looking ${a.g("male","female","and attractive")} ${a.name_lower}. You love being a pokemon. Humans love fucking you and you love fucking humans.

Your trainer was Professor Cherry for a long time. You always loved the way she handled your ${a.g(a.dCock(),a.dPussy(),"body")}. The last time she masturbated you, Cherry told you she'll be handing you off to a brand new trainer who's never had a pokemon before. You're excited, and you hope ${p.shell} be able to handle your ${a.g(a.dCock(),a.dPussy(),"body")} as well as Cherry.

Now you're waiting in your pokeball, thinking about all the sexy things you're going to do to that trainer once you see them.

And just then, you see a flash of light and suddenly you're standing in a house, in someone's bedroom. Someone released you from your pokeball. You look around and see moody lighting, sexy music, and closed curtains. Then you look at the bed and see a person, a ${p.gender_word}, fully nude and holding your empty pokeball.

${p.She} must be your new trainer. Your look over ${p.her} naked body, and they smile at you. It seems ${p.she} recognized that you're a ${a.name_lower}. ${p.Shes} incredibly attractive, and you can feel your `
		
		if (a.m) {
			str = str + `${a.dCock()} becoming erect. You look down at your ${a.dCock()}, then back to your trainer.`
		} else if (a.f) {
			str = str + `${a.dPussy()} heating up. You look down to your ${a.dPussy()}, and then back to your trainer.`
		} else {
			str = str + `body tingling with arousal. You look at your trainer.`
		}

		if (p.m) {
			str = str + ` ${p.f ? "her" : p.m ? "his" : "their"} cock is already rock hard and dripping precum.`
		} else if (p.f) {
			str = str + ` ${p.f ? "her" : p.m ? "his" : "their"} pussy is already soaking the bed.`
		} else {
			str = str + " They can't seem to sit still, they're so eager to get to know you more intimately."
		}

		str = str + ` You see your new trainer glance at your ${a.g(a.dCock(),a.dPussy(),"genitals")}. ${p.She} wants what you want. Your ${a.g(a.dCock(),a.dPussy(),"body")} ${a.pg ? "twinge" : "twinges"}. Your trainer beckons you toward the bed, where ${p.she}`
		
		return str
	}
})

scenes.set("nursing", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`You are an 18 year old ${p.gender_word} pokemon trainer. You are deeply in love with your ${a.name_lower}. ${a.name} is very ${a.g("fatherly","motherly","parental")}. ${a.name} babies you and takes care of you. ${a.name} loves you like a child. ${a.name} is very loving and affectionate to you. ${a.name} doesn't want to fuck you. ${a.name} wants to ${p.g("jerk you off","finger you","masturbate you")} while you ${a.g("nurse on his cock","nurse on her breasts","suck on its body")}. ${a.name} will slowly and passionately masturbate you while you nurse.`)

		if (a.f) {
			add_context(`${a.name} will orgasm as you nurse her. ${a.name} would rather orgasm from nursing that from sex.`)
		}

		// str
		var str = `You're an 18 year old ${p.gender_word}. Your favorite pokemon is your ${a.name_lower}. Your favorite pokemon is your ${a.name_lower}. ${a.Shes} always been there for you and you love ${a.her} very much. ${a.name} loves you too. ${a.name} is like a ${a.g("father","mother","parental")} figure to you. You look up to ${a.him} and ${a.she} takes care of you.

This night started out like any other. You and ${a.name_lower} lay on the couch, spooning. You're the little spoon, of course. ${a.name} has always loved wrapping you up in ${a.her} ${a.s.arms ? "arms" : "body"}. This night, though, you have another idea. You rolled over to face ${a.name}. ${a.Her} face is beautiful in the dim light. ${a.name} looks at you with ${a.her} gentle, loving eyes and smiles. You look at ${a.her} ${a.g("soft "+a.dCock(),"breasts","sensitive bits")}. ${a.name} breathes heavily and adjusts ${a.herself} to give you a better view. You see that ${a.her} ${a.g(a.dCock(),"nipples","body")} ${a.g(a.pg,true,false) ? "are" : "is"} ${a.g("engorging","erect","aroused")}.

You bend down to ${a.name_lower}'s ${a.g(a.dCock(),"teat","bits")} and slowly work ${a.g(a.pg,false,true) ? "them" : "it"} into your mouth. You apply a slow, seductive suction as you begin to nurse on ${a.her} ${a.g(a.dCock(),"breast","body")}. ${a.She} lets out a relaxed, ${a.g("fatherly","motherly","parental")} moan at the new sensation, and looks at you with that gentle loving look ${a.she} always has. ${a.She} holds you close as you nurse`

		return str
	}
})

scenes.set("oral", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`You are an 18 year old `)
	}
})

scenes.set("oral_rr", {
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true
		},
		{
			type: "pokemon",
			key: "a",
			name: "your pokemon"
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// context
		add_context(`You are an 18 year old `)
	}
})

scenes.set("date", {
	category: "humans",
	hidden: true,
	actors: [
		{
			type: "person",
			key: "p",
			firstPerson: true,
		},
		{
			type: "npc",
			key: "t",
			name: `the other person`
		}
	],
	build: function(v) {
		var p = v.p
		var t = v.t

		// context
		add_you(`You are a sexy 18 year old ${p.gender_word}.`)
		add_context(`You went on a date with ${t.name}. ${t.name} thinks you're really hot. ${t.name} is super attracted to you, but you have to seduce ${t.her} first. You have to warm ${t.her} up to you and make ${t.her} horny, and then ${t.shell} have sex with you.`)

		// string
		var str = `You're a great-looking ${p.gender_word}.

Your date with ${t.name} is going great! ${t.name} is clearly super into you. You bring ${t.her} back to your hotel and watch a movie. You notice throughout the movie ${t.shes} adjusting ${t.herself}, trying to get closer to you and giving you seductive looks. You know what's happening next.`
		
		return str
	}
})

scenes.set("md_initiation", {
	category: "md",
	hidden: true,
	actors: [
		{
			type: "pokemon",
			key: "a",
			firstPerson: true,
		},
		{
			type: "pokemon",
			key: "b",
			name: `the guild leader`
		}
	],
	build: function(v) {
		var a = v.a
		var b = v.b

		// context
		add_you(`You are a sexy 18 year old ${a.gender_word} ${a.name_lower}. You have${a.pg ? "" : " a"} ${a.g(a.dCock(),a.dPussy(),"sexy body")}. Everyone is attracted to you. You're shy and sexually inexperienced. You're also very intimidated by ${b.name}.`)
		add_context(`You are a new member in the Lustland Adventuring Guild. You've always wanted to join the guild and become an adventurer. The lead of the Lustland Adventuring Guild, ${b.name}, is a sexy ${b.gender_word} with${b.pg ? "" : " a"} ${b.g(b.dCock(),b.dPussy(),"gorgeous body")}. ${b.name} is super horny, and ${b.hell} let you into the guild if you make ${b.him} cum. Once you're in the guild, ${b.name} will make you ${b.his} personal sex slave.`)

		// string
		var str = `You're a great-looking ${a.gender_word} ${a.name_lower}.

You've always wanted to join the Lustland Adventuring Guild and today is the day! Your application was approved and you're going to meet the guild leader, ${b.name}. You just have to impress ${b.him} and your dream will come true!

Some other guild members guide you into ${b.name}'s office at the guild HQ. The guild members leave the two of you alone and lock the door.

${b.name} looks at you and smiles. ${b.He} must like you.

"I'm gonna be honest, we aren't really accepting new members right now."

Your heart sinks. You've been looking forward to this for so long! "Please, ${b.name}! I have lots of skills! I'll do anything!"

"Hmm," ${b.name} thinks for a moment. I don't normally do this... but then again I don't normally see ${a.name_lower_p} that look like you..."

Where is ${b.he} going with this...?

${b.He} continues, "Let me tell you what. You do me a favor and I'll consider letting you in the guild."

You perk up. "Yes! Anything!"

"Alright then." ${b.name} exposes ${b.himself} and gestures to his ${b.g(b.dCock(),b.dPussy(),"genitals")}.`

		if (b.m) {
			str = str + ` ${b.pg ? "They throb" : "It throbs"} with desire and ${b.pg ? "begin" : "begins"} to stiffen.`
		} else if (b.f) {
			str = str + ` ${b.pg ? "The twitch" : "It twitches"} with desire and ${b.pg ? "begin" : "begins"} to leak its juices.`
		}

		str = str + ` ${b.name} continues, "Show me that you're worth having around."`

		return str
	}
})

// Scene->Command conversion
var scenario_options = []
scenes.forEach(function(desc, name) {
	var command = "scenario_"+name
	var command_template = "/"+command

	var scene_args = []

	function addSceneArg(word) {
		var key = "<" + scene_args.length + ">"
		command_template = command_template + " " + key
		scene_args[scene_args.length] = {
			key: key,
			word: word
		}
	}

	var first_person_index = -1
	desc.actors.forEach(function(actor) {
		if (actor.type == "pokemon") {
			if (actor.firstPerson) {
				first_person_index = scene_args.length
				addSceneArg(`What is your species? (Use underscores instead of spaces, e.g. "galarian_zapdos")`)
				addSceneArg(`What is your gender?`)
			} else {
				addSceneArg(`What is ${actor.name}'s species? (Use underscores instead of spaces, e.g. "galarian_zapdos")`)
				addSceneArg(`What is ${actor.name}'s gender?`)
			}
		} else if (actor.type == "person") {
			if (actor.firstPerson) {
				first_person_index = scene_args.length
				addSceneArg(`What is your gender? (Use underscores instead of spaces, e.g. "trans_girl")`)
			} else {
				addSceneArg(`What is ${actor.name}'s gender? (Use underscores instead of spaces, e.g. "trans_girl")`)
			}
		} else if (actor.type == "npc") {
			if (actor.firstPerson) {
				first_person_index = scene_args.length
				addSceneArg(`Who are you? (Use underscores instead of spaces, e.g. "daisy_oak")`)
			} else {
				addSceneArg(`Who is ${actor.name}? (Use underscores instead of spaces, e.g. "daisy_oak")`)
			}
		}
	})

	scenario_options[name] = {
		prompt: command_template,
		args: scene_args,
		name: name
	}

	tagFunctions.set(command, {
		args: scene_args.length,
		call: function(args) {
			var input = []

			var n = 0;
			desc.actors.forEach(function(actor, index) {
				var data = {}

				data.gender_word = "<undefined>"
				data.m = false
				data.f = false

				data.g = function(m, f, x) {
					return data.m ? m : data.f ? f : (x ? x : f)
				}

				data.x = function(a, b) {return data.g(a, a, b)}

				if (actor.type == "pokemon") {
					var species_name = args[n].toLowerCase()
					if (species_name == "x") {
						species_name = getRandomKey(species)
					} else if (species_name.substr(0, 2) == "x[") {
						var end = species_name.search("]")
						var contents = species_name.substr(2, end-2)
						var json_contents = `[ ["` + replaceAll(contents, ";", `","`) + `"] ]`
						json_contents = replaceAll(json_contents, "+", `"],["`)
						var contents_array = JSON.parse(json_contents)

						var options = []
						species.forEach(function(s) {
							var ok = true
							contents_array.forEach(function(set) {
								var set_ok = false
								set.forEach(function(item) {
									set_ok = set_ok || s[item] || s.name == item
								})
								ok = ok && set_ok
							})
							if (ok) {
								options[options.length] = s.name
							}
						})

						data.randomOptions = options

						if (options.length <= 0) {
							species_name = "missingno"
						} else {
							species_name = options[rand(0, options.length-1)]
						}
					}
					var gender_word = args[n+1]
					if (gender_word.toLowerCase() == "x") {
						gender_word = Math.random() < 0.5 ? "male" : "female"
					}

					load_species(species_name, gender_word, desc.category || "feral")

					data.s = getSpecies(species_name)
					data.gender_word = gender_word
					data.m = isMale(data.gender_word)
					data.f = isFemale(data.gender_word)
					data.dick_slang = getDickSlang(data.s)
					data.dick_slang_plural = getDickSlang(data.s, true)
					data.pussy_slang = getPussySlang(data.s)
					data.pussy_slang_plural = getPussySlang(data.s, true)
					data.dick = dicks.get(data.s.dick)
					data.pussy = dicks.get(data.s.pussy)
					data.name = data.s.name_word
					data.name_lower = data.s.name_word.toLowerCase()
					data.name_lower_p = data.s.name_word_plural.toLowerCase()
					data.dick_plural = data.s.dick_plural
					data.pussy_plural = data.s.pussy_plural

					if (first_person_index == n) {
						add_you(`You are an attractive ${data.m ? "male" : data.f ? "female" : ", sexy,"} ${data.name_lower}. You are a pokemon. Pokemon can't talk. You have always been a ${data.name_lower} and you always will be a ${data.name_lower}.`)
					}

					data.dCock = function(plural) {
						return replaceAll(dCock(data.s), "<ds>", plural ? data.dick_slang_plural : data.dick_slang)
					}
					data.dPussy = function(plural) {
						return replaceAll(dPussy(data.s), "<ps>", plural ? data.pussy_slang_plural : data.pussy_slang)
					}
					data.dBody = function() {
						return dBody(data.s)
					}
					data.dSkin = function() {
						return dSkin(data.s)
					}

					data.pg = data.m ? data.dick_plural : data.f ? data.pussy_plural : false

					n+=2
				} else if (actor.type == "person") {
					var gender_word = args[n]
					if (gender_word.toLowerCase() == "x") {
						gender_word = Math.random() < 0.5 ? "male" : "female"
					}

					data.gender_word = replaceAll(gender_word, "_", " ")
					data.m = isMale(data.gender_word)
					data.f = isFemale(data.gender_word)

					if (first_person_index == n) {
						add_you(`You are an attractive 18 year old ${data.g}. You are also a pokemon trainer.`)
					}

					n++
				} else if (actor.type == "npc") {
					var npc_name = args[n]
					if (npc_name.toLowerCase() == "x") {
						npc_name = getRandomKey(people)
					}

					var info = load_person(npc_name)
					data.m = info.m
					data.f = info.f
					data.gender_word = data.g("male","female","non-binary")
					data.name = info.name
					data.name_lower = data.name.toLowerCase()
					data.party = info.party

					if (first_person_index == n) {
						add_you(`You are ${info.name_word}.`)
					}
				}

				data.his = data.g("his","her","they're")
				data.her = data.his
				data.he = data.g("he","she","they")
				data.she = data.he
				data.hes = data.g("he's","she's","they're")
				data.shes = data.hes
				data.himself = data.g("himself","herself","themself")
				data.herself = data.himself
				data.hell = data.g("he'll","she'll","they'll")
				data.shell = data.hell
				data.him = data.g("him","her","them")

				data.His = cap(data.his)
				data.Her = cap(data.her)
				data.He = cap(data.he)
				data.She = cap(data.she)
				data.Hes = cap(data.hes)
				data.Shes = cap(data.shes)
				data.Himself = cap(data.himself)
				data.Hereslf = cap(data.herself)
				data.Hell = cap(data.hell)
				data.Shell = cap(data.shell)
				data.Him = cap(data.him)

				input[actor.key] = data
			})

			// category context
			if (desc.category == "humans") {
				add_context(`I describe people in great detail, especially their genitals. I'll always describe how someone is moving. I love writing about breasts, penises, and vaginas. I go into highly erotic detail about everything people do.

If a person's genitals are visible, I describe them in extreme detail. I describe the skin, the color, the shape, the texture, everything. I describe every situation in great detail.

I'll repeat a person's name often so you don't forget who they are.`)
			} else if (desc.category == "md") {
				add_context(`Everyone in the world is a pokemon. Pokemon have animal attributes and amazing abilities. There are no humans in this world. Humans don't exist. Trainers don't exist.

Casual sex is normal. Everyone is always naked so sometimes people get aroused and have to relieve themselves. No one ever wears clothes. Clothes don't exist.

Pokemon are very vocal. They will talk about what they're thinking about and how they're feeling.

I describe Pokémon in great detail, especially their genitals. Pokemon genitalia fascinates me so I write about ever little detail. I love pokemon cocks and pokemon pussies. It's obvious that I'm super kinky by the way I write. Sex with pokemon is the best.

If a pokemon's cock is visible I describe it. I describe all the cock skin, the cock muscules, the cock veins, and everything else about sexy pokemon cocks. I describe every sensation in great detail.

I'll repeat a pokemon's species name often so that you don't forget what species they are.`)
			} else {
				add_context(`Everyone fucks their Pokémon. Pokémon are sexy and attractive and pokemon want to fuck humans. Sex with Pokémon is normal. Everyone knows trainers fuck their Pokémon.

Pokemon can't talk or speak. Pokemon never talk. Pokemon never speak.

I describe Pokémon in great detail, especially their genitals. Pokemon genitalia fascinates me so I write about ever little detail. I love pokemon cocks and pokemon pussies. It's obvious that I'm super kinky by the way I write. Sex with pokemon is the best.

If a pokemon's cock is visible I describe it. I describe all the cock skin, the cock muscules, the cock veins, and everything else about sexy pokemon cocks. I describe every sensation in great detail.

I'll repeat a pokemon's species name often so that you don't forget what species they are.`)
			}

			return desc.build(input)
		}
	})
})

////////////////
// WORLD INFO //
////////////////

// people
//save("cherry", "Professor Cherry is the resident pokemon professor in Bumfuck Town. Cherry is an expert on pokemon sexuality and she loves teaching people everything there is to know about sex with pokemon. Cherry will tell you all sorts of pokemon sex trivia. Cherry is fascinated by pokemon genitalia.")
//save("mandy", "Mandy is the gym leader of a fire-type gym in Cocksville City. Her best pokemon is a female Charizard.")

// places
save("bumfuck", "Bumfuck Town is your hometown. It connects to Route 1.")
save("route 1", "Route 1 connects Bumfuck Town to Cocksville City. You can travel it in about 30 minutes. There are a few pokemon trainers and weak wild pokemon here.")
save("cocksville", "Cocksville City is a small city. It has a fire-type pokemon gym led by Leader Mandy.")

////////////
// PEOPLE //
////////////
var people = new Map()

// Lusteron
people.set("prof_cherry", {
	name: "Professor Cherry",
	f: true,
	signal: "cherry",
	wi: "Professor Cherry is the resident pokemon professor in Bumfuck Town. Cherry is an expert on pokemon sexuality and she loves teaching people everything there is to know about sex with pokemon. Professor Cherry will tell you all sorts of pokemon sex trivia. Cherry is fascinated by pokemon genitalia.",
	party: ["gardevoir", "braixen", "vaporeon", "lopunny", "salazzle", "lucario", "zeraora", "zoroark"]
})

// Kanto
people.set("prof_oak", {
	name: "Professor Oak",
	m: true,
	signal: "oak",
	wi: "Professor Oak is the resident pokemon professor in Pallet Town of the Kanto region. He has grey hair, brown eyes, and he wears a lab coat. He is about 60 years old and he loves teach people about pokemon. Oak's grandson is the pokemon champion, Blue",
	party: ["tauros", "exeggutor", "arcanine", "charizard", "blastoise", "venusaur", "gyarados"]
})
people.set("mom", {
	name: "Your Mom",
	f: true,
	signal: "mom",
	wi: "Your mom is a traditionally pretty woman in her 40s. Your mom has blue hair and green eyes. Your mom loves you and always looks out for you. She wants to help you however she can. Your mom is excited for you being a trainer."
})
people.set("red", {
	name: "Red",
	m: true,
	signal: "red",
	wi: "Red is the pokemon champion of the Kanto region. He is an extremely powerful trainer. Red wears a red cap, red jacket, and blue jeans. Red has brown hair. Red never speaks. Red never talks.",
	party: ["pikachu", "espeon", "lapras", "snorlax", "venusaur", "charizard", "blastoise", "meganium", "feraligatr", "typhlosion", "jolteon", "scizor", "tauros", "raikou", "entei", "suicune", "dragonite"]
})
people.set("blue", {
	name: "Blue",
	m: true,
	signal: "blue",
	wi: "Blue is the pokemon champion of the Kanto region. Blue is an extremely powerful trainer. Blue has spikey brown hair and wears a blue shirt. Blue is really full of himself, and he thinks he's better than everyone else. Blue is a bit of a dick. Blue's grandfather is Professor Oak.",
	party: ["pidgeot", "alakazam", "rhydon", "arcanine", "exeggutor", "blastoise", "gyarados", "charizard", "venusaur", "sandslash", "ninetales", "magneton", "vaporeon", "cloyster", "jolteon", "flareon", "tyranitar", "heracross", "machamp", "rhyperior", "aerodactyl", "mega_charizard_y", "cubone", "slowbro", "clefable", "electabuzz", "pinsir", "scyther", "miltank", "gengar", "houndoom", "piloswine", "kingdra"]
})
people.set("daisy_oak", {
	name: "Daisy Oak",
	f: true,
	signal: "daisy",
	wi: "Daisy Oak is a sweet 18 year old girl. She has a crush on you but she's really shy. Daisy has long brown hair. Daisy Oak lives in Pallet Town with her brother, Blue.",
})
people.set("brock", {
	name: "Brock",
	m: true,
	signal: "brock",
	wi: "Brock is a 24-year-old male pokemon trainer. He is the pokemon gym leader of the Pewter City gym. Brock is a rock-type pokemon trainer. Brock knows a lot about pokemon breeding. Brock loves to teach people about pokemon.",
	party: ["geodude", "onix", "rhyhorn", "omastar", "kabutops", "graveler", "golem", "relicanth", "rampardos", "aerodactyl", "tyranitar", "rhyperior", "vulpix", "omanyte", "kabuto", "cubone", "golbat", "ninetales", "dugtrio", "forretress", "steelix", "rhydon", "ursaring", "shuckle", "heracross"]
})
people.set("misty", {
	name: "Misty",
	f: true,
	signal: "misty",
	wi: "Misty is a 22-year-old female pokemon trainer. Misty is the pokemon gym leader of the Cerulean City gym in the Kanto region. Misty is a water-type pokemon trainer. Misty loves swimming. Misty is bubbly and fun, but she can be fiesty and snappy if she doesn't get her way. Misty is cute. Misty has red hair and blue eyes. Misty has small breasts. Misty wears short shorts and a tight crop top.",
	party: ["staryu", "starmie", "golduck", "quagsire", "lapras", "lanturn", "floatzel", "milotic", "seaking", "slowbro", "blastoise", "jellicent", "swanna", "carracosta", "psyduck", "golduck", "dewgong", "vaporeon", "gyarados", "horsea", "seel", "exeggutor", "seadra", "dugtrio", "togetic", "togepi", "sunflora", "poliwhirl", "wigglytuff", "nidoqueen", "ampharos", "dragonair", "politoed"]
})

// add
function load_person(name) {
	save(people.get(name).signal, people.get(name).wi)
	return people.get(name)
}

////////////////
// ADJECTIVES //
////////////////
// materials
adjectives.set("plant", ["squishy", "leafy", "waxy", "juicy", "firm"])
// colors
adjectives.set("green", ["green", "grass-colored", "lime", "forest green", "jade"])
adjectives.set("red", ["red", "ruby", "fiery red", "rose-colored", "cherry-colored", "crimson", "maroon", "reddish"])
adjectives.set("orange", ["sunset-colored", "orange", "fiery orange", "tangerine-colored", "topaz-colored", "red-orange", "yellow-orange", "peach-colored"])
adjectives.set("blue", ["blue", "ocean blue", "baby blue", "sky blue", "sapphire-colored", "cerulean", "aquamarine", "deep blue"])
adjectives.set("brown", ["brown", "dark orange", "chocolate", "oak-colored", "walnut-colored"])
adjectives.set("tan", ["tawny", "tan", "light orange", "light brown", "brownish-orange"])
adjectives.set("black", ["black", "dark-colored", "dark grey"])
adjectives.set("lightblue", ["light blue", "sky blue", "baby blue", "blue-white", "bluish white", "bright blue", "pale blue"])
adjectives.set("purple", ["purple", "lavender", "royal purple", "bluish purple", "violet"])
adjectives.set("yellow", ["yellow", "yellow-orange", "dandelion-colored"])
adjectives.set("pink", ["pink", "rose-colored", "pale red"])
adjectives.set("bluegreen", ["aquamarine", "blue-green", "bluish green", "torquoise"])
adjectives.set("white", ["white", "pearl-white", "milky-white", "cloud-white"])
adjectives.set("grey", ["grey", "stormy grey", "dark grey", "light grey"])
adjectives.set("bodycolor_generic", ["colorful"])
// appearance
adjectives.set("pretty", ["pretty", "beautiful", "gorgeous", "breathtaking", "bombshell", "alluring", "attractive", "sexy"])
adjectives.set("toned", ["toned", "sexy", "lithe", "muscular", "hot"])
// dick size descriptors
adjectives.set("dick_tiny", ["tiny", "small", "pathetic", "little", "pathetic little"])
adjectives.set("dick_small", ["below-average", "small", "rather small", "smallish", "short", "thin"])
adjectives.set("dick_med", ["average", "average-sized", "respectable", "decent", "medium-sized"])
adjectives.set("dick_large", ["large", "big", "rather large", "above average", "thick", "girthy", "fat", "long", "sexy", "veiny"])
adjectives.set("dick_huge", ["monster", "massive", "giant", "thick", "way above average", "girthy", "fat", "extra long", "extra thick", "veiny", "arm-like"])
adjectives.set("dick_colossal", ["monstrous", "fearsome", "colossal", "awe-inspiring", "gigantic", "unbelievably huge", "worship-worthy", "gigantic", "incredibly thick"])
// dick slang
adjectives.set("dick_slang_tiny", ["peanut-like cock", "pecker", "dick", "cock"])
adjectives.set("dick_slang_tiny_plural", ["peanut-like cocks", "peckers", "dicks", "cocks"])
adjectives.set("dick_slang_small", ["pecker", "dick", "cock"])
adjectives.set("dick_slang_small_plural", ["peckers", "dicks", "cocks"])
adjectives.set("dick_slang_med", ["cock", "dick", "penis"])
adjectives.set("dick_slang_med_plural", ["cocks", "dicks", "penises"])
adjectives.set("dick_slang_big", ["rod", "cock", "dick", "penis"])
adjectives.set("dick_slang_big_plural", ["rods", "cocks", "dicks", "penises"])
adjectives.set("dick_slang_huge", ["cock", "dick", "penis", "rod", "phallus"])
adjectives.set("dick_slang_huge_plural", ["cocks", "dicks", "penises", "rods", "phalluses"])
adjectives.set("dick_slang_colossal", ["cock", "dick", "penis", "rod", "phallus"])
adjectives.set("dick_slang_colossal_plural", ["cocks", "dicks", "penises", "rods", "phalluses"])
// pussy slang
adjectives.set("pussy_slang", ["pussy", "cunt"])
adjectives.set("pussy_slang_plural", ["pussies", "cunts"])

/////////////
// SPECIES //
/////////////
var species = new Map()

function getSpecies(name) {
	if (species.get(name)) {
		return species.get(name)
	} else {
		if (!name) {
			name = "<undefined>"
		}

		var name_word = cap(name)
		name_word = replaceAll(name_word, "_", " ")

		var plural = name_word + "s"
		if (name_word.substr(name_word.length-1) == "s" || name_word.substr(name_word.length-2) == "sh") {
			plural = name_word + "es"
		}

		species.set(name, {
			name: name,
			bodyColor: "bodycolor_generic",
			body: "nondescript",
			cockSize: "medium",
			skinType: "skin",
			dick: "nondescript",
			pussy: "nondescript",
			bodySize: "medium",
			name_word: name_word,
			name_word_plural: plural
		})

		return species.get(name)
	}
}

////////////////
// BODY SIZES //
////////////////
// default is medium
var bodySizes = new Map()

bodySizes.set("tiny", {
	species: ["caterpie", "metapod", "weedle", "kakuna", "pidgey", "rattata", "alolan_rattata", "nidoran_f", "nidoran_m", "oddish", "paras", "parasect", "venonat", "ledyba", "spinarak", "pichu", "cleffa", "igglybuff", "togepi", "sunkern", "yanma", "phanpy", "smoochum", "elekid", "magby", "surskit", "nincada", "kricketot", "budew", "burmy", "grass_burmy", "sand_burmy", "trash_burmy", "combee", "cherubi", "chingling", "bronzor", "bonsly", "mime_jr.", "happiny", "mantyke", "tepig", "oshawott", "patrat", "lillipup", "woobat", "tympole", "sewaddle", "cottonee", "petilil", "dwebble", "solosis", "vanillish", "emolga", "karrablast", "foongus", "joltik", "ferroseed", "klink", "tynamo", "litwick", "shelmet", "scatterbug", "spewpa", "flabebe", "klefki"],
	adj: ["tiny"]
})
bodySizes.set("small", {
	species: ["bulbasaur", "charmander", "squirtle", "butterfree", "beedrill", "raticate", "alolan_raticate", "spearow", "pikachu", "sandshrew", "alolan_sandshrew", "clefairy", "vulpix", "alolan_vulpix", "jigglypuff", "zubat", "gloom", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "meowth", "alolan_meowth", "galarian_meowth", "psyduck", "mankey", "growlithe", "poliwag", "abra", "machop", "bellsprout", "weepinbell", "tentacool", "geodude", "alolan_geodude", "ponyta", "galarian_ponyta", "magnemite", "farfetch'd", "galarian_farfetch'd", "shellder", "krabby", "gastly", "voltorb", "exeggcute", "cubone", "koffing", "tangela", "horsea", "goldeen", "staryu", "ditto", "eevee", "porygon", "omanyte", "kabuto", "dratini", "mew", "chikorita", "cyndaquil", "totodile", "sentret", "hoothoot", "ledian", "ariados", "chinchou", "togetic", "natu", "hoppip", "aipom", "sunflora", "wooper", "murkrow", "misdreavus", "unown", "pineco", "qwilfish", "sneasel", "teddiursa", "slugma", "swinub", "corsola", "galarian_corsola", "remoraid", "donphan", "porygon2", "smeargle", "tyrogue", "celebi", "teecko", "torchic", "mudkip", "poochyena", "zigzagoon", "galarian_zigzagoon", "linoone", "galarian_linoone", "masquerain", "shroomish", "shedinja", "ninjask", "whismur", "azurill", "nosepass", "skitty", "aron", "meditite", "electrike", "plusle", "minun", "volbeat", "illumise", "roselia", "gulpin", "carvanha", "spoink", "spinda", "trapinch", "vibrava", "cacnea", "swablu", "barboach", "corphish", "baltoy", "anorith", "feebas", "castform", "sunny_castform", "rainy_castform", "snowy_castform", "shuppet", "dusclops", "chimecho", "wynaut", "snorunt", "spheal", "clamperl", "luvdisc", "bagon", "beldum", "jirachi", "turtwig", "chimchar", "piplup", "starly", "bidoof", "kricketune", "shinx", "cranidos", "shieldon", "wormadam", "grass_wormadam", "sand_wormadam", "trash_wormadam", "mothim", "pachirisu", "buizel", "sunny_cherrim", "overcast_cherrim", "west_shellos", "east_shellos", "drifloon", "buneary", "chatot", "munchlax", "riolu", "scorupi", "finneon", "rotom", "fan_rotom", "mow_rotom", "uxie", "mesprit", "azelf", "phone_rotom", "dex_rotom", "phione", "manaphy", "land_shaymin", "sky_shaymin", "victini", "snivy", "pignite", "dewott", "watchog", "herdier", "purrloin", "swoobat", "drillbur", "gurdurr", "swadloon", "venipede", "whimsicott", "basculin", "sandile", "darumaka", "galarian_darumaka", "scraggy", "yamask", "galarian_yamask", "tirtouga", "archen", "trubbish", "zorua", "minccino", "gothita", "duosion", "ducklett", "vanillite", "summer_deerling", "winter_deerling", "spring_deerling", "autumn_deerling", "f_frillish", "m_frillish", "klang", "elgyem", "lampent", "axew", "cubchoo", "stunfisk", "galarian_stunfisk", "mienfoo", "golett", "pawniard", "rufflet", "vullaby", "durant", "deino", "larvesta", "meloetta", "chespin", "fennekin", "froakie", "bunnelby", "fletchling", "vivillon", "litleo", "floette", "skiddo", "pancham", "espurr", "spritzee", "swirlix", "inkay", "binacle", "skrelp", "clauncher", "helioptile", "tyrunt", "amaura", "dedenne", "carbink", "goomy", "phantump", "pumpkaboo", "bergmite", "noibat", "hoopa_confined"],
	adj: ["small"]
})
bodySizes.set("large", {
	species: ["venusaur", "charizard", "blastoise", "pidgeot", "fearow", "nidoking", "nidoqueen", "ninetales", "alolan_ninetales", "venomoth", "persian", "alolan_persian", "arcanine", "poliwrath", "tentacruel", "dodrio", "muk", "alolan_muk", "cloyster", "galarian_weezing", "kangaskhan", "lapras", "aerodactyl", "dragonite", "mewtwo", "ampharos", "sudowoodo", "quagsire", "scizor", "heracross", "octillery", "mantine", "skarmory", "houndoom", "kingdra", "raikou", "entei", "suicune", "sceptile", "blaziken", "swampert", "slaking", "exploud", "hariyama", "camerupt", "torkoal", "flygon", "cacturne", "altaria", "claydol", "cradily", "armaldo", "walrein", "salamence", "metagross", "regirock", "registeel", "regice", "latias", "latios", "deoxys", "attack_deoxys", "defense_deoxys", "speed_deoxys", "torterra", "empoleon", "infernape", "staraptor", "bibarel", "luxray", "bastiodon", "floatzel", "west_gastrodon", "east_gastrodon", "drifblim", "honchkrow", "purugly", "skuntank", "bronzong", "gabite", "lucario", "hippowdon", "drapion", "toxicroak", "carnivine", "magnezone", "yanmega", "gliscor", "gallade", "probopass", "dusknoir", "heatran", "cresselia", "darkrai", "emboar", "samurott", "excadrill", "darmanitan", "galarian_darmanitan", "zen_darmanitan", "galarian_zen_darmanitan", "sigilyph", "cofagrigus", "carracosta", "archeops", "zoroark", "gothitelle", "reuniclus", "f_jellicent", "m_jellicent", "alomomola", "galvantula", "galvantula", "ferrothorn", "klinklang", "beheeyem", "chandelure", "cryogonal", "druddigon", "braviary", "mandibuzz", "heatmor", "cobalion", "terrakion", "virizion", "therian_thundurus", "therian_tornadus", "therian_landorus", "incarnate_thundurus", "incarnate_tornadus", "incarnate_landorus", "genesect", "chesnaught", "delphox", "greninja", "diggersby", "pyroar", "pangoro", "malamar", "barbaracle", "dragalge", "heliolisk", "trevenant", "avalugg", "volcanion"],
	adj: ["large"]
})
bodySizes.set("huge", {
	species: ["arbok", "alolan_exeggutor", "gyarados", "snorlax", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "aggron", "tyranitar", "wailmer", "milotic", "tropius", "garchomp", "abomasnow", "lickilicky", "rhyperior", "tangrowth", "electivire", "magmortar", "serperior", "conkeldurr", "seismitoad", "scolipede", "krookodile", "garbodor", "eelektross", "haxorus", "beartic", "golurk", "hydreigon", "volcarona", "reshiram", "zekrom", "kyurem", "white_kyurem", "black_kyurem", "tyrantrum", "aurorus", "goodra", "noivern", "xerneas", "yveltal", "zygarde_50", "hoopa_unbound"],
	adj: ["huge"]
})
bodySizes.set("gigantic", {
	species: ["onix", "steelix", "ho-oh", "lugia", "shadow_lugia", "wailord", "kyogre", "groudon", "rayquaza", "mamoswine", "dialga", "palkia", "regigigas", "altered_giratina", "origin_giratina", "arceus", "zygarde_100"],
	adj: ["gigantic"]
})
bodySizes.set("medium", {
	species: [],
	adj: ["medium-sized"]
})

bodySizes.forEach(function(value, name) {
	var uuid = "bodysize_" + name

	// adjectives
	adjectives.set(uuid, value.adj)

	// apply to species
	value.species.forEach(function(species) {
		var data = getSpecies(species)
		data[uuid] = true
		data.bodySize = name
	})
})

/////////////////
// BODY COLORS //
/////////////////
// default is nondescript
var bodyColors = new Map()

bodyColors.set("nondescript", {
	species: []
})
bodyColors.set("red", {
	species: ["voltorb", "magmar", "magikarp", "flareon", "ledyba", "ledian", "ariados", "yanma", "scizor", "slugma", "magcargo", "octillery", "delibird", "magby", "entei", "ho-oh", "blaziken", "wurmple", "corphish", "crawdaunt", "latias", "groudon", "deoxys", "attack_deoxys", "defense_deoxys", "speed_deoxys", "kricketot", "kricketune", "dex_rotom", "phone_rotom", "heatran", "pansear", "simisear", "throh", "venipede", "scolipede", "krookodile", "darumaka", "darmanitan", "pawniard", "bisharp", "braviary", "tyrantrum", "hawlucha", "yveltal", "volcanion"]
})
bodyColors.set("purple", {
	species: ["butterfree", "rattata", "ekans", "arbok", "nidoran_m", "nidorino", "nidoking", "venonat", "venomoth", "grimer", "muk", "shellder", "cloyster", "gastly", "haunter", "gengar", "koffing", "weezing", "starmie", "jynx", "ditto", "aerodactyl", "galarian_articuno", "mewtwo", "crobat", "aipom", "espeon", "galarian_slowking", "misdreavus", "forretress", "gligar", "granbull", "tyrogue", "shadow_lugia", "cascoon", "dustox", "loudred", "exploud", "delcatty", "sableye", "volbeat", "illumise", "swalot", "grumpig", "lileep", "snowy_castform", "overcast_cherrim", "ambipom", "drifloon", "drifblim", "mismagius", "stunky", "skuntank", "spiritomb", "drapion", "gliscor", "purrloin", "liepard", "roggenrola", "boldore", "gigalith", "whirlipede", "accelgor", "mienshao", "genesect", "espurr", "m_meowstic", "inkay", "malamar", "goomy", "sliggoo", "goodra", "noibat", "hoopa_confined", "hoopa_unbound"]
})
bodyColors.set("blue", {
	species: ["squirtle", "wartortle", "blastoise", "nidoran_f", "zubat", "golbat", "oddish", "gloom", "vileplume", "golduck", "poliwag", "poliwhirl", "poliwrath", "machop", "machoke", "machamp", "tentacool", "tentacruel", "tangela", "horsea", "seadra", "gyarados", "lapras", "vaporeon", "omanyte", "omastar", "articuno", "dratini", "dragonair", "totodile", "croconaw", "feraligatr", "chinchou", "lanturn", "marill", "azumarill", "skiploom", "wooper", "quagsire", "wobbuffet", "mantine", "kingdra", "phanpy", "suicune", "mudkip", "marshtomp", "swampert", "lotad", "taillow", "swellow", "surskit", "azurill", "nosepass", "manectric", "carvanha", "sharpedo", "wailmer", "wailord", "swablu", "altaria", "whiscash", "armaldo", "rainy_castform", "wynaut", "spheal", "sealeo", "walrein", "clamperl", "huntail", "bagon", "salamence", "beldum", "metang", "metagross", "regice", "latios", "kyogre", "piplup", "prinplup", "empoleon", "shinx", "chatot", "gible", "gabite", "garchomp", "riolu", "lucario", "skorupi", "croagunk", "toxicroak", "finneon", "lumineon", "mantyke", "probopass", "dialga", "phione", "manaphy", "oshawott", "dewott", "samurott", "panpour", "simipour", "tympole", "palpitoad", "seismitoad", "sawk", "tirtouga", "carracosta", "karrablast", "eelektrik", "eelektross", "cryogonal", "druddigon", "therian_thundurus", "incarnate_thundurus", "keldeo", "froakie", "frogadier", "greninja", "clauncher", "clawitzer", "aurorus", "xerneas"]
})
bodyColors.set("bluegreen", {
	species: ["nidorina", "nidoqueen", "snorlax", "pineco", "qwilfish", "heracross", "pupitar", "east_gastrodon", "bronzor", "bronzong", "munchlax", "tangrowth", "woobat", "swoobat", "zen_darmanitan", "elgyem", "golett", "golurk", "cobalion"]
})
bodyColors.set("green", {
	species: ["bulbasaur", "ivysaur", "venusaur", "caterpie", "metapod", "alolan_grimer", "alolan_muk", "scyther", "chikorita", "bayleef", "meganium", "spinarak", "natu", "xatu", "bellossom", "politoed", "jumpluff", "sunflora", "larvitar", "tyranitar", "celebi", "treecko", "grovyle", "sceptile", "lombre", "ludicolo", "breloom", "electrike", "roselia", "gulpin", "flygon", "cacnea", "cacturne", "cradily", "keckleon", "tropius", "rayquaza", "turtwig", "grotle", "torterra", "budew", "roserade", "burmy", "grass_burmy", "wormadam", "grass_wormadam", "carnivine", "yanmega", "snivy", "servine", "serperior", "pansage", "simisage", "sewaddle", "swadloon", "leavanny", "petilil", "lilligant", "basculin", "maractus", "trubbish", "solosis", "duosion", "reuniclus", "summer_deerling", "axew", "virizion", "therian_tornadus", "incarnate_tornadus", "chespin", "quilladin", "chesnaught"]
})
bodyColors.set("yellow", {
	species: ["weedle", "kakuna", "beedrill", "pikachu", "sandshrew", "sandslash", "ninetales'", "psyduck", "abra", "kadabra", "alakazam", "bellsprout", "weepinbell", "victreebel", "drowzee", "hypno", "electabuzz", "jolteon", "zapdos", "pichu", "mareep", "ampharos", "sunkern", "girafarig", "dunsparce", "shuckle", "elekid", "raikou", "numel", "combee", "vespiqueen", "sunny_cherrim", "chingling", "electivire", "scraggy", "cofagrigus", "joltik", "galvantula", "helioptile", "heliolisk"]
})
bodyColors.set("orange", {
	species: ["charmander", "charmeleon", "charizard", "paras", "parasect", "raichu", "alolan_raichu", "vulpix", "growlithe", "arcanine", "krabby", "kingler", "goldeen", "seaking", "galarian_zapdos", "moltres", "dragonite", "torchic", "combusken", "camerupt", "trapinch", "solrock", "sunny_castform", "regirock", "chimchar", "monferno", "infernape", "buizel", "floatzel", "magmortar", "rotom", "heat_rotom", "wash_rotom", "frost_rotom", "fan_rotom", "mow_rotom", "tepig", "pignite", "emboar", "dwebble", "crustle", "scrafty", "archen", "archeops", "autumn_deerling", "stunfisk", "heatmor", "volcarona", "therian_landorus", "incarnate_landorus", "fennekin", "braixen", "delphox", "fletchling", "fletchinder", "talonflame", "dedenne"]
})
bodyColors.set("tan", {
	species: ["pidgey", "pidgeotto", "pidgeot", "raticate", "meowth", "galarian_meowth", "persian", "mankey", "primeape", "geodude", "graveler", "alolan_graveler", "golem", "alolan_golem", "ponyta", "rapidash", "doduo", "dodrio", "staryu", "taurus", "eevee", "cyndaquil", "quilava", "typhlosion", "togepi", "stantler", "smeargle", "zigzagoon", "linoone", "shroomish", "slakoth", "shedinja", "makuhita", "hariyama", "mawile", "plusle", "minun", "spinda", "vibrava", "lunatone", "baltoy", "feebas", "milotic", "shieldon", "bastiodon", "sand_burmy", "sand_wormadam", "hippopotas", "hippowdon", "leafeon", "victini", "timburr", "gurdurr", "conkeldurr", "sandile", "krokorok", "mienfoo"]
})
bodyColors.set("brown", {
	species: ["spearow", "fearow", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "farfetch'd", "galarian_farfetch'd", "exeggutor", "alolan_exeggutor", "cubone", "marowak", "alolan_marowak", "hitmonlee", "hitmonchan", "kangaskhan", "pinsir", "kabuto", "kabutops", "sentret", "furret", "hoothoot", "noctowl", "sudowoodo", "teddiursa", "ursaring", "swinub", "piloswine", "hitmontop", "seedot", "nuzleaf", "shiftry", "slaking", "relicanth", "bidoof", "bibarel", "buneary", "lopunny", "bonsly", "rhyperior", "mamoswine", "patrat", "watchog", "lillipup", "herdier", "stoutland", "drillbur", "excadrill", "whimsicott", "garbodor", "winter_deerling", "sawsbuck", "beheeyem", "bouffalant", "vullaby", "mandibuzz", "terrakion", "litleo", "pyroar", "skiddo", "gogoat", "skrelp", "dragalge", "tyrunt", "phantump", "trevenant", "pumpkaboo", "gourgeist"]
})
bodyColors.set("black", {
	species: ["alolan_rattata", "alolan_raticate", "alolan_meowth", "alolan_persian", "galarian_weezing", "galarian_moltres", "umbreon", "murkrow", "unown", "sneasel", "houndour", "houndoom", "galarian_zigzagoon", "galarian_linoone", "ninjask", "seviper", "claydol", "shuppet", "banette", "duskull", "dusclops", "snorunt", "starly", "staravia", "staraptor", "luxio", "luxray", "mothim", "honchkrow", "weavile", "dusknoir", "darkrai", "blitzle", "zebstrika", "sigilyph", "yamask", "galarian_yamask", "zorua", "zoroark", "gothita", "gothorita", "gothitelle", "lampent", "chandelure", "galarian_stunfisk", "deino", "zweilous", "hydreigon", "zekrom", "kyurem", "white_kyurem", "black_kyurem", "meloetta", "scatterbug", "spewpa", "vivillon", "pancham", "pangoro", "noivern", "zygarde_10", "zygarde_50", "zygarde_100"]
})
bodyColors.set("grey", {
	species: ["alolan_geodude", "magnemite", "magneton", "onix", "rhyhorn", "rhydon", "steelix", "skarmory", "donphan", "poochyena", "mightyena", "aron", "lairon", "aggron", "meditite", "spoink", "barboach", "anorith", "registeel", "cranidos", "rampardos", "glameow", "purugly", "magnezone", "altered_giratina", "origin_giratina", "missingno", "pidove", "tranquill", "unfezant", "minccino", "cinccino", "escavalier", "ferroseed", "ferrothorn", "klink", "klang", "klinklang", "fraxure", "haxorus", "shelmet", "durant", "bunnelby", "diggersby", "honedge", "duoblade", "aegislash", "binacle", "barbaracle", "carbink", "klefki"]
})
bodyColors.set("white", {
	species: ["galarian_ponyta", "galarian_rapidash", "seel", "dewgong", "electrode", "togetic", "galarian_corsola", "lugia", "silcoon", "beautifly", "wingull", "pelipper", "ralts", "kirlia", "gardevoir", "masquerain", "vigoroth", "nincada", "zangoose", "castform", "absol", "glalie", "shellgon", "jirachi", "pachirisu", "snover", "abomasnow", "togekiss", "gallade", "froslass", "regigigas", "land_shaymin", "sky_shaymin", "arceus", "cottonee", "galarian_darumaka", "galarian_darmanitan", "galarian_zen_darmanitan", "swanna", "vanillite", "vanillish", "vanilluxe", "emolga", "foongus", "amoongus", "tynamo", "litwick", "beartic", "rufflet", "larvesta", "reshiram", "flabebe", "floette", "florges", "furfrou", "f_meowstic"]
})
bodyColors.set("pink", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "slowpoke", "galarian_slowpoke", "slowbro", "galarian_slowbro", "exeggcute", "lickitung", "chansey", "mr._mime", "galarian_mr._mime", "porygon", "mew", "cleffa", "igglybuff", "flaaffy", "hoppip", "slowking", "snubbull", "corsola", "porygon2", "smoochum", "miltank", "blissey", "whismur", "skitty", "medicham", "gorebyss", "luvdisc", "trash_burmy", "trash_wormadam", "cherubi", "west_shellos", "west_gastrodon", "mime_jr.", "happiny", "lickilicky", "porygon_z", "palkia", "munna", "musharna", "audino", "spring_deerling", "f_frillish", "f_jellicent", "alomomola", "spritzee", "aromatisse", "swirlix", "slurpuff", "sylveon", "diancie"]
})
bodyColors.set("lightblue", {
	species: ["alolan_sandshrew", "alolan_sandslash", "nidoran_f", "alolan_vulpix", "alolan_ninetales", "remoraid", "chimecho", "east_shellos", "glaceon", "uxie", "mesprit", "azelf", "cresselia", "ducklett", "m_frillish", "m_jellicent", "cubchoo", "amaura", "bergmite", "avalugg"]
})

bodyColors.forEach(function(value, name) {
	var uuid = "bodycolor_" + name

	// apply to species
	value.species.forEach(function(speciesName) {
		var data = getSpecies(speciesName)
		data[uuid] = true
		data.bodyColor = name
	})
})

////////////////
// SKIN TYPES //
////////////////
// default is skin
var skinTypes = new Map()

skinTypes.set("skin", {
	species: [],
	adj: ["skin"]
})
skinTypes.set("scales", {
	species: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard", "squirtle", "wartortle", "blastoise", "ekans", "arbok", "horsea", "seadra", "goldeen", "seaking", "magikarp", "gyarados", "dratini", "dragonair", "dragonite", "totodile", "croconaw", "feraligatr", "remoraid", "treecko", "grovyle", "sceptile", "mudkip", "marshtomp", "swampert", "carvanha", "sharpedo", "seviper", "whiscash", "barboach", "feebas", "milotic", "kecleon", "bagon", "shellgon", "salamence", "gible", "gabite", "garchomp", "finneon", "lumineon", "snivy", "servine", "serperior", "basculin", "sandile", "krokorok", "krookodile", "alomomola", "tynamo", "eelektrik", "eelektross", "axew", "fraxure", "haxorus", "deino", "zweilous", "hydreigon", "zekrom", "kyurem", "white_kyurem", "black_kyurem", "helioptile", "heliolisk", "tyrunt", "tyrantrum", "amaura", "aurorus", "zygarde_10", "zygarde_50", "zygarde_100"],
	adj: ["scales"]
})
skinTypes.set("chitin", {
	species: ["metapod", "kakuna", "beedrill", "paras", "parasect", "scyther", "pinsir", "ledyba", "ledian", "spinarak", "ariados", "yanma", "scizor", "heracross", "nincada", "shedinja", "ninjask", "trapinch", "vibrava", "flygon", "anorith", "armaldo", "rayquaza", "kricketot", "kricketune", "combee", "vespiqueen", "skorupi", "drapion", "yanmega", "gliscor", "venipede", "whirlipede", "scolipede", "dwebble", "crustle", "karrablast"],
	adj: ["chitin", "chitinous armor"]
})
skinTypes.set("feathers", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "psyduck", "golduck", "farfetch'd", "galarian_farfetch'd", "doduo", "dodrio", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "hoothoot", "noctowl", "natu", "xatu", "murkrow", "delibird", "ho-oh", "lugia", "shadow_lugia", "torchic", "combusken", "blaziken", "taillow", "swellow", "wingull", "pelipper", "starly", "staravia", "staraptor", "honchkrow", "chatot", "pidove", "tranquill", "unfezant", "archen", "archeops", "ducklett", "swanna", "rufflet", "braviary", "vullaby", "mandibuzz", "reshiram", "fletchling", "fletchinder", "talonflame", "spritzee", "aromatisse", "hawlucha"],
	adj: ["feathers"]
})
skinTypes.set("fur", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "vulpix", "alolan_vulpix", "ninetales", "alolan_ninetales", "venonat", "venomoth", "meowth", "alolan_meowth", "galarian_meowth", "persian", "alolan_persian", "mankey", "primeape", "growlithe", "arcanine", "abra", "kadabra", "alakazam", "ponyta", "galarian_ponyta", "rapidash", "galarian_rapidash", "cubone", "marowak", "alolan_marowak", "electabuzz", "tauros", "eevee", "vaporeon", "jolteon", "flareon", "snorlax", "mewtwo", "mew", "cyndaquil", "quilava", "typhlosion", "sentret", "furret", "pichu", "aipom", "espeon", "umbreon", "girafarig", "snubbull", "granbull", "sneasel", "teddiursa", "ursaring", "swinub", "piloswine", "houndour", "houndoom", "stantler", "smeargle", "elekid", "magby", "miltank", "raikou", "entei", "suicune", "poochyena", "mightyena", "zigzagoon", "galarian_zigzagoon", "linoone", "galarian_linoone", "slakoth", "vigoroth", "slaking", "azurill", "skitty", "delcatty", "mawile", "electrike", "manectric", "plusle", "minun", "numel", "camerupt", "spoink", "grumpig", "spinda", "zangoose", "absol", "spheal", "sealeo", "walrein", "bidoof", "bibarel", "shinx", "luxio", "luxray", "pachirisu", "buizel", "floatzel", "ambipom", "buneary", "lopunny", "glameow", "purugly", "stunky", "skuntank", "munchlax", "riolu", "lucario", "weavile", "electivire", "magmortar", "leafeon", "glaceon", "mamoswine", "land_shaymin", "sky_shaymin", "victini", "tepig", "pignite", "emboar", "oshawott", "dewott", "samurott", "patrat", "watchog", "lillipup", "herdier", "stoutland", "purrloin", "liepard", "pansage", "simisage", "panpour", "simipour", "pansear", "simisear", "blitzle", "zebstrika", "woobat", "swoobat", "drillbur", "excadrill", "darumaka", "galarian_darumaka", "darmanitan", "galarian_darmanitan", "zorua", "zoroark", "minccino", "cinccino", "spring_deerling", "summer_deerling", "autumn_deerling", "winter_deerling", "sawsbuck", "emolga", "joltik", "galvantula", "cubchoo", "beartic", "mienfoo", "mienshao", "bouffalant", "larvesta", "volcarona", "cobalion", "virizion", "fennekin", "braixen", "delphox", "bunnelby", "diggersby", "litleo", "pyroar", "pancham", "pangoro", "furfrou", "espurr", "m_meowstic", "f_meowstic", "sylveon", "dedenne", "noibat", "noivern", "xerneas"],
	adj: ["fur", "fluff", "fuzz"]
})
skinTypes.set("wool", {
	species: ["mareep", "flaaffy", "ampharos", "cottonee", "whimsicott", "skiddo", "gogoat"],
	adj: ["wool"]
})
skinTypes.set("leathery", {
	species: ["sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash", "nidoran_f", "nidorina", "nidoqueen", "nidoran_m", "nidorino", "nidoking", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "rhyhorn", "rhydon", "koffing", "weezing", "galarian_weezing", "kangaskhan", "staryu", "starmie", "aerodactyl", "phanpy", "donphan", "larvitar", "pupitar", "tyranitar", "seedot", "nuzleaf", "shiftry", "wailmer", "wailord", "torkoal", "groudon", "turtwig", "grotle", "torterra", "cranidos", "rampardos", "shieldon", "bastiodon", "hippopotas", "hippowdon", "timburr", "gurdurr", "conkeldurr", "heatmor", "terrakion", "therian_thundurus", "therian_tornadus", "therian_landorus", "incarnate_thundurus", "incarnate_tornadus", "incarnate_landorus", "volcanion"],
	adj: ["leathery skin"]
})
skinTypes.set("moist", {
	species: ["poliwag", "poliwhirl", "poliwrath", "tentacruel", "tentacool", "lapras", "omanyte", "omastar", "chinchou", "lanturn", "marill", "azumarill", "politoed", "wooper", "quagsire", "qwilfish", "shuckle", "octillery", "mantine", "kingdra", "lotad", "ludicolo", "lombre", "huntail", "gorebyss", "relicanth", "luvdisc", "kyogre", "deoxys", "speed_deoxys", "attack_deoxys", "defense_deoxys", "piplup", "prinplup", "empoleon", "west_shellos", "east_shellos", "west_gastrodon", "east_gastrodon", "croagunk", "toxicroak", "mantyke", "phione", "manaphy", "tympole", "palpitoad", "seismitoad", "tirtouga", "carracosta", "m_frillish", "f_frillish", "m_jellicent", "f_jellicent", "froakie", "frogadier", "greninja", "inkay", "malamar", "skrelp", "dragalge"],
	adj: ["moist skin"]
})
skinTypes.set("plant", {
	species: ["bellsprout", "victreebel", "weepinbell", "tangela", "bellossom", "hoppip", "skiploom", "jumpluff", "sunkern", "sunflora", "celebi", "roselia", "cacnea", "cacturne", "lileep", "cradily", "tropius", "budew", "roserade", "burmy", "grass_burmy", "grass_wormadam", "cherubi", "sunny_cherrim", "overcast_cherrim", "carnivine", "snover", "abomasnow", "tangrowth", "sewaddle", "swadloon", "leavanny", "petilil", "lilligant", "maractus", "foongus", "amoongus", "flabebe", "floette", "florges", "pumpkaboo", "gourgeist"],
	adj: ["plant-like skin"]
})
skinTypes.set("bark", {
	species: ["exeggutor", "alolan_exeggutor", "sudowoodo", "pineco", "bonsly", "phantump", "trevenant"],
	adj: ["bark"]
})
skinTypes.set("rock", {
	species: ["geodude", "alolan_geodude", "graveler", "alolan_graveler", "golem", "alolan_golem", "onix", "forretress", "corsola", "galarian_corsola", "nosepass", "lunatone", "solrock", "baltoy", "claydol", "regirock", "sand_burmy", "sand_wormadam", "rhyperior", "roggenrola", "boldore", "gigalith", "zen_darmanitan", "sigilyph", "elgyem", "beheeyem", "druddigon", "binacle", "barbaracle", "honedge", "duoblade", "aegislash", "carbink", "diancie"],
	adj: ["rocks", "stone"]
})
skinTypes.set("metal", {
	species: ["magnemite", "magneton", "steelix", "skarmory", "aron", "lairon", "aggron", "beldum", "metang", "metagross", "registeel", "trash_wormadam", "trash_burmy", "chingling", "bronzor", "bronzong", "magnezone", "heat_rotom", "wash_rotom", "freeze_rotom", "fan_rotom", "mow_rotom", "escavalier", "ferroseed", "ferrothorn", "klink", "klang", "klinklang", "lampent", "chandelure", "shelmet", "golett", "golurk", "pawniard", "bisharp", "durant", "genesect", "klefki"],
})
skinTypes.set("slime", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk", "ditto", "slugma", "magcargo", "solosis", "duosion", "reuniclus", "goomy", "sliggoo", "goodra"],
	adj: ["slime"]
})
skinTypes.set("shell", {
	species: ["shellder", "cloyster", "krabby", "kingler", "exeggcute", "kabuto", "kabutops", "togepi", "corphish", "crawdaunt", "clamperl", "clauncher", "clawitzer"],
	adj: ["shell"]
})
skinTypes.set("ghost", {
	species: ["gastly", "haunter", "gengar", "misdreavus", "sableye", "duskull", "dusclops", "mismagius	", "spiritomb", "rotom", "darkrai", "yamask", "galarian_yamask", "cofagrigus"],
	adj: ["ghostly essence"]
})
skinTypes.set("plastic", {
	species: ["porygon", "voltorb", "electrode", "porygon2", "porygon_z", "missingno"],
	adj: ["plastic"]
})
skinTypes.set("silk", {
	species: ["silcoon", "cascoon"],
	adj: ["silk"]
})
skinTypes.set("cloud", {
	species: ["castform", "sunny_castform", "rainy_castform", "snowy_castform"],
	adj: ["cloud"]
})
skinTypes.set("fabric", {
	species: ["shuppet", "banette", "drifloon", "drifblim", "dusknoir", "accelgor"],
	adj: ["fabric"]
})
skinTypes.set("ice", {
	species: ["glalie", "regice", "froslass", "vanillite", "vanillish", "vanilluxe", "cryogonal", "bergmite", "avalugg"],
	adj: ["ice"]
})
skinTypes.set("snow", {
	species: ["galarian_zen_darmanitan"],
	adj: ["snow"]
})
skinTypes.set("garbage", {
	species: ["trubbish", "garbodor"],
	adj: ["garbage"]
})
skinTypes.set("wax", {
	species: ["litwick"],
	adj: ["wax"]
})

skinTypes.forEach(function(value, name) {
	var uuid = "skintype_" + name

	// adjectives
	adjectives.set(uuid, value.adj)

	// apply to species
	value.species.forEach(function(speciesName) {
		var data = getSpecies(speciesName)
		data[uuid] = true
		data.skinType = name
	})
})

////////////////
// COCK SIZES //
////////////////
// default is medium
var cockSizes = new Map()

cockSizes.set("tiny", {
	species: ["pidgey", "rattata", "alolan_rattata", "oddish", "paras", "exeggcute", "horsea", "kabuto", "ledyba", "spinarak", "pichu", "cleffa", "igglybuff", "togepi", "hoppip", "sunkern", "yanma", "smoochum", "elekid", "magby", "wurmple", "silcoon", "cascoon", "surskit", "masquerain", "azurill", "nincada", "trapinch", "feebas", "wynaut", "snorunt", "clamperl", "burmy", "wormadam", "grass_burmy", "grass_wormadam", "sand_burmy", "sand_wormadam", "trash_burmy", "trash_wormadam", "budew", "kricketot", "combee", "cherubi", "chingling", "bonsly", "mime_jr.", "happiny", "mantyke", "tepig", "oshawott", "patrat", "lillipup", "pidove", "woobat", "tympole", "sewaddle", "cottonee", "petilil", "dwebble", "solosis", "emolga", "karrablast", "joltik", "ferroseed", "klink", "tynamo", "litwick", "cubchoo", "larvesta", "fletchling", "scatterbug", "spewpa", "flabebe", "klefki"],
	slang: "dick_slang_tiny",
})
cockSizes.set("small", {
	species: ["bulbasaur", "charmander", "raticate", "alolan_raticate", "spearow", "ekans", "pikachu", "nidoran_f", "nidoran_m", "clefairy", "clefable", "vulpix", "alolan_vulpix", "jigglypuff", "wigglytuff", "zubat", "gloom", "parasect", "venonat", "psyduck", "abra", "machop", "bellsprout", "magnemite", "farfetch'd", "galarian_farfetch'd", "gastly", "krabby", "cubone", "chansey", "goldeen", "staryu", "magikarp", "eevee", "omanyte", "dratini", "mew", "chikorita", "cyndaquil", "totodile", "sentret", "furret", "hoothoot", "ledian", "ariados", "togetic", "natu", "skiploom", "aipom", "wooper", "unown", "pineco", "forretress", "dunsparce", "gligar", "qwilfish", "sneasel", "teddiursa", "slugma", "swinub", "galarian_corsola", "remoraid", "tyrogue", "larvitar", "celebi", "treecko", "torchic", "mudkip", "poochyena", "zigzagoon", "galarian_zigzagoon", "beautifly", "lotad", "seedot", "taillow", "wingull", "ralts", "shroomish", "shedinja", "ninjask", "whismur", "nosepass", "makuhita", "skitty", "aron", "meditite", "electrike", "plusle", "minun", "roselia", "gulpin", "carvanha", "spoink", "vibrava", "cacnea", "swablu", "barboach", "corphish", "baltoy", "anorith", "castform", "sunny_castform", "rainy_castform", "snowy_castform", "shuppet", "duskull", "chimecho", "spheal", "luvdisc", "bagon", "jirachi", "piplup", "chimchar", "starly", "bidoof", "shinx", "mothim", "kricketune", "pachirisu", "drifloon", "buneary", "glameow", "chatot", "munchlax", "riolu", "skorupi", "finneon", "snover", "phione", "land_shaymin", "sky_shaymin", "victini", "snivy", "watchog", "purrloin", "pansage", "pansear", "panpour", "munna", "tranquill", "roggenrola", "drillbur", "swadloon", "venipede", "whimsicott", "basculin", "darumaka", "galarian_darumaka", "scraggy", "yamask", "galarian_yamask", "trubbish", "zorua", "minccino", "gothita", "ducklett", "vanillite", "spring_deerling", "summer_deerling", "autumn_deerling", "winter_deerling", "foongus", "elgyem", "shelmet", "mienfoo", "golett", "pawniard", "rufflet", "vullaby", "durant", "deino", "chespin", "fennekin", "froakie", "bunnelby", "fletchinder", "vivillon", "litleo", "floette", "skiddo", "pancham", "espurr", "spritzee", "swirlix", "inkay", "binacle", "carbink", "dedenne", "skrelp", "clauncher", "helioptile", "phantump", "pumpkaboo", "bergmite", "noibat"],
	slang: "dick_slang_small",
})
cockSizes.set("large", {
	species: ["venusaur", "charizard", "wartortle", "pidgeot", "arbok", "ninetales", "alolan_ninetales", "vileplume", "venomoth", "persian", "alolan_persian", "poliwrath", "mankey", "tentacruel", "ponyta", "galarian_ponyta", "slowpoke", "galarian_slowpoke", "dodrio", "dewgong", "muk", "alolan_muk", "shellder", "gengar", "drowzee", "hypno", "exeggutor", "alolan_exeggutor", "alolan_marowak", "hitmonlee", "hitmonchan", "weezing", "galarian_weezing", "rhyhorn", "rhydon", "scyther", "tauros", "vaporeon", "jolteon", "flareon", "aerodactyl", "snorlax", "mewtwo", "meganium", "typhlosion", "feraligatr", "crobat", "lanturn", "flaaffy", "azumarill", "sudowoodo", "politoed", "espeon", "umbreon", "slowking", "galarian_slowking", "wobbuffet", "granbull", "scizor", "heracross", "shuckle", "ursaring", "piloswine", "mantine", "skarmory", "houndoom", "kingdra", "donphan", "blissey", "raikou", "suicune", "entei", "sceptile", "blaziken", "swampert", "ludicolo", "shiftry", "pelipper", "vigoroth", "exploud", "hariyama", "sharpedo", "camerupt", "torkoal", "grumpig", "flygon", "cacturne", "whiscash", "claydol", "cradily", "armaldo", "milotic", "banette", "dusclops", "absol", "huntail", "metang", "regirock", "regice", "registeel", "latios", "deoxys", "attack_deoxys", "defense_deoxys", "speed_deoxys", "grotle", "empoleon", "infernape", "staraptor", "luxray", "roserade", "floatzel", "east_shellos", "west_shellos", "ambipom", "drifblim", "mismagius", "honchkrow", "skuntank", "bronzong", "gible", "lucario", "toxicroak", "carnivine", "weavile", "togekiss", "yanmega", "leafeon", "glaceon", "gliscor", "porygon_z", "gallade", "probopass", "heat_rotom", "wash_rotom", "freeze_rotom", "fan_rotom", "mow_rotom", "serperior", "emboar", "samurott", "stoutland", "liepard", "simisage", "simipour", "simisear", "unfezant", "boldore", "gurdurr", "palpitoad", "throh", "sawk", "krokorok", "darmanitan", "galarian_darmanitan", "zen_darmanitan", "galarian_zen_darmanitan", "scrafty", "sigilyph", "cofagrigus", "tirtouga", "archeops", "zoroark", "gothitelle", "reuniclus", "swanna", "vanilluxe", "sawsbuck", "escavalier", "amoongus", "f_jellicent", "m_jellicent", "alomomola", "galvantula", "ferrothorn", "klinklang", "eelektrik", "beheeyem", "chandelure", "fraxure", "mienshao", "heatmor", "bisharp", "zweilous", "therian_thundurus", "therian_tornadus", "therian_landorus", "incarnate_thundurus", "incarnate_tornadus", "incarnate_landorus", "keldeo", "genesect", "chesnaught", "delphox", "greninja", "diggersby", "talonflame", "pyroar", "gogoat", "pangoro", "m_meowstic", "aegislash", "malamar", "barbaracle", "dragalge", "sylveon", "heliolisk", "sliggoo", "gourgeist", "zygarde_10", "volcanion"],
	slang: "dick_slang_big",
})
cockSizes.set("huge", {
	species: ["blastoise", "nidoking", "nidoqueen", "arcanine", "primeape", "rapidash", "galarian_rapidash", "slowbro", "galarian_slowbro", "cloyster", "lickitung", "kangaskhan", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "dragonite", "ampharos", "quagsire", "girafarig", "slaking", "walrein", "salamence", "metagross", "torterra", "rampardos", "bastiodon", "east_gastrodon", "west_gastrodon", "spiritomb", "gabite", "hippowdon", "drapion", "abomasnow", "magnezone", "rhyperior", "tangrowth", "electivire", "magmortar", "dusknoir", "heatran", "cresselia", "darkrai", "blitzle", "zebstrika", "gigalith", "excadrill", "seismitoad", "scolipede", "krookodile", "carracosta", "garbodor", "eelektross", "haxorus", "beartic", "druddigon", "golurk", "bouffalant", "braviary", "mandibuzz", "hydreigon", "volcarona", "cobalion", "terrakion", "virizion", "kyurem", "trevenant", "avalugg", "noivern", "xerneas", "zygarde_50", "hoopa_unbound"],
	slang: "dick_slang_huge",
})
cockSizes.set("colossal", {
	species: ["onix", "gyarados", "lapras", "steelix", "tyranitar", "ho-oh", "lugia", "shadow_lugia", "aggron", "wailmer", "wailord", "tropius", "kyogre", "groudon", "rayquaza", "garchomp", "lickilicky", "mamoswine", "dialga", "palkia", "regigigas", "altered_giratina", "origin_giratina", "arceus", "zekrom", "reshiram", "white_kyurem", "black_kyurem", "tyrantrum", "aurorus", "goodra", "yveltal", "zygarde_100"],
	slang: "dick_slang_colossal",
})
cockSizes.set("medium", {
	species: [],
	slang: "dick_slang_med",
	adj: ["average-sized"]
})

cockSizes.forEach(function(value, name) {
	var uuid = "cocksize_" + name

	// adjectives
	adjectives.set(uuid, value.adj)

	// apply to species
	value.species.forEach(function(speciesName) {
		var data = getSpecies(speciesName)
		data[uuid] = true
		data.cockSize = name
	})
})

////////////////
// BODY TYPES //
////////////////
// dex: <n>: species name, <ln>: lower species name, <p>: plural species name, <lp>: lower plural species name, <size>: body size, <color>: body color
var bodies = new Map()

// default
bodies.set("nondescript", {
	species: [],
	adj: ["interesting-looking"],
	plural: "nothing you've ever seen before"
})

// reptilian
bodies.set("reptilian_quad", {
	species: ["bulbasaur", "ivysaur", "venusaur", "shellgon", "shieldon", "bastiodon", "dialga", "heatran", "helioptile", "volcanion"],
	adj: ["four-legged reptile", "quadrupedal reptile"],
	plural: "quadrupedal reptiles that walk on all fours"
})
bodies.set("reptilian_biped", {
	species: ["charmander", "charmeleon", "kangaskhan", "larvitar", "tyranitar", "treecko", "grovyle", "sceptile", "bagon", "groudon", "cranidos", "rampardos", "axew", "fraxure", "haxorus", "heliolisk"],
	adj: ["two-legged reptile", "bipedal reptile"],
	plural: "bipedal reptiles that walk on their hind legs",
	arms: 2
})
bodies.set("reptilian_sextuped", {
	species: ["altered_giratina"],
	adj: ["six-legged reptile", "six-legged dinosaur", "six-legged monster"],
	plural: "six-legged reptiles"
})
bodies.set("draconic_biped", {
	species: ["charizard", "dragonite", "flygon", "palkia", "druddigon", "reshiram", "zekrom", "white_kyurem", "black_kyurem", "kyurem", "goodra", "noivern"],
	adj: ["two-legged dragon", "bipedal dragon"],
	plural: "bipdel dragons",
	arms: 2
})
bodies.set("draconic_quad", {
	species: ["salamence", "deino"],
	adj: ["four-legged dragon", "quadrupedal dragon"],
	plural: "quadrupedal dragons"
})
bodies.set("draconic_quad_twohead", {
	species: ["zweilous"],
	adj: ["two-headed dragon", "double-headed dragon"],
	plural: "two-headed dragons"
})
bodies.set("draconic_handheads", {
	species: ["hydreigon"],
	adj: ["three-headed dragon", "triple-headed dragon"],
	plural: "three-headed dragons"
})
bodies.set("draconic_serpent", {
	species: ["rayquaza", "origin_giratina"],
	adj: ["serpentine dragon"],
	plural: "serpentine dragons"
})
bodies.set("turtle_biped", {
	species: ["squirtle", "wartortle", "blastoise", "carracosta"],
	adj: ["two-legged turtle", "bipedal turtle"],
	plural: "bipedal turtles",
	arms: 2
})
bodies.set("sea_turtle", {
	species: ["tirtouga"],
	adj: ["sea turtle"],
	plural: "sea turtles"
})
bodies.set("tortoise", {
	species: ["shuckle", "torkoal", "turtwig", "grovyle", "torterra"],
	plural: "tortoises"
})
bodies.set("snake", {
	species: ["ekans", "onix", "steelix", "serperior", "zygarde_50"],
	adj: ["snake", "serpent"],
	plural: "snakes"
})
bodies.set("snake_biped", {
	species: ["snivy", "servine"],
	adj: ["bipedal snake", "two-legged snake"],
	plural: "two-legged snakes"
})
bodies.set("cobra", {
	species: ["arbok"],
	plural: "cobras"
})
bodies.set("viper", {
	species: ["seviper"],
	plural: "vipers"
})
bodies.set("brontosaur", {
	species: ["chikorita", "bayleef", "meganium", "tropius", "amaura", "aurorus"],
	plural: "brontosaurs"
})
bodies.set("crocodile", {
	species: ["sandile"],
	plural: "crocodiles"
})
bodies.set("crocodile_biped", {
	species: ["totodile", "croconaw", "feraligatr", "krokorok", "krookodile"],
	adj: ["bipedal crocodile", "two-legged crocodile"],
	plural: "bipedal crocodiles"
})
bodies.set("chameleon_biped", {
	species: ["kecleon"],
	adj: ["bipedal chameleon", "two-legged chameleon"],
	plural: "chameleons"
})
bodies.set("trex", {
	species: ["tyrunt", "tyrantrum"],
	adj: ["t-rex", "tyrannosaurus rex", "dinosaur", "tyrannosaur"],
	plural: "tyrannosaurus rexes"
})

// amphibian
bodies.set("tadpole", {
	species: ["poliwag", "tympole"],
	plural: "tadpoles"
})
bodies.set("frog", {
	species: ["lotad", "froakie"],
	plural: "frogs"
})
bodies.set("frog_bipedal", {
	species: ["poliwhirl", "poliwrath", "politoed", "lombre", "ludicolo", "croagunk", "toxicroak", "palpitoad", "seismitoad"],
	adj: ["bipedal frog", "two-legged frog", "frogadier", "greninja"],
	plural: "frogs",
	arms: 2
})
bodies.set("axolotl", {
	species: ["wooper", "quagsire", "mudkip", "marshtomp", "swampert"],
	plural: "axolotls"
})

// aquatic
bodies.set("seacreature", {
	species: ["phione", "manaphy"],
	adj: ["sea creature"],
	plural: "sea creatures",
	arms: 2
})
bodies.set("seaslug", {
	species: ["west_shellos", "east_shellos", "west_gastrodon", "east_gastrodon"],
	adj: ["sea slug"],
	plural: "sea slugs"
})
bodies.set("squid", {
	species: ["tentacool", "tentacruel", "inkay", "malamar"],
	plural: "squids",
})
bodies.set("jellyfish", {
	species: ["m_frillish", "f_frillish", "m_jellicent", "f_jellicent"],
	plural: "jellyfish"
})
bodies.set("seal", {
	species: ["seel", "dewgong"],
	plural: "seals"
})
bodies.set("clam", {
	species: ["shellder", "cloyster", "clamperl"],
	plural: "clams"
})
bodies.set("crab", {
	species: ["krabby", "kingler", "dwebble", "crustle"],
	plural: "crabs"
})
bodies.set("seahorse", {
	species: ["horsea", "seadra", "kingdra"],
	plural: "seahorses"
})
bodies.set("sea_dragon", {
	species: ["skrelp", "dragalge"],
	adj: ["sea dragon"],
	plural: "sea dragons"
})
bodies.set("fish", {
	species: ["goldeen", "seaking", "magikarp", "remoraid", "barboach", "whiscash", "feebas", "relicanth", "luvdisc", "finneon", "lumineon", "alomomola", "tynamo", "stunfisk"],
	plural: "fish"
})
bodies.set("starfish", {
	species: ["staryu", "starmie"],
	plural: "starfish"
})
bodies.set("sea_serpent", {
	species: ["gyarados", "dratini", "dragonair", "milotic", "huntail", "gorebyss"],
	adj: ["sea serpent"],
	plural: "sea serpents"
})
bodies.set("plesiosaur", {
	species: ["lapras"],
	plural: "plesiosaurs"
})
bodies.set("nautilus", {
	species: ["omanyte", "omastar"],
	plural: "nautiluses"
})
bodies.set("trilobite", {
	species: ["kabuto", "anorith"],
	plural: "trilobites"
})
bodies.set("trilobite_biped", {
	species: ["kabutops", "armaldo"],
	adj: ["bipedal trilobite", "two-legged trilobite"],
	plural: "bipedal trilobites"
})
bodies.set("anglerfish", {
	species: ["chinchou", "lanturn"],
	adj: ["angler fish"],
	plural: "angler fish",
})
bodies.set("pufferfish", {
	species: ["qwilfish"],
	adj: ["puffer fish"],
	plural: "puffer fish"
})
bodies.set("octopus", {
	species: ["octillery"],
	plural: "octopuses"
})
bodies.set("mantaray", {
	species: ["mantine", "mantyke"],
	adj: ["manta ray"],
	plural: "manta rays"
})
bodies.set("piranha", {
	species: ["carvanha", "basculin"],
	plural: "piranhas"
})
bodies.set("shark", {
	species: ["sharpedo"],
	plural: "sharks"
})
bodies.set("shark_biped", {
	species: ["gible", "gabite", "garchomp"],
	adj: ["bipedal shark", "two-legged shark"],
	plural: "bipedal sharks",
	arms: 2
})
bodies.set("whale", {
	species: ["wailmer", "wailord", "kyogre"],
	plural: "whales"
})
bodies.set("lobster", {
	species: ["corphish", "crawdaunt", "clauncher", "clawitzer"],
	plural: "lobsters"
})
bodies.set("eel", {
	species: ["eelektrik"],
	plural: "eels"
})
bodies.set("eel_arms", {
	species: ["eelektross"],
	adj: ["eel", "two-armed eel"],
	plural: "two-armed eels",
	arms: 2
})
bodies.set("barnacle", {
	species: ["binacle", "barbaracle"],
	plural: "barnacles"
})

// insect
bodies.set("caterpillar", {
	species: ["caterpie", "wurmple", "sewaddle"],
	plural: "caterpillars"
})
bodies.set("grub", {
	species: ["weedle", "larvesta", "scatterbug"],
	plural: "grubs"
})
bodies.set("cocoon", {
	species: ["metapod", "kakuna", "pupitar", "silcoon", "cascoon", "swadloon", "spewpa"],
	plural: "cocoons with eyes"
})
bodies.set("butterfly", {
	species: ["butterfree", "beautifly", "vivillon"],
	adj: ["butterfly"],
	plural: "butterflies"
})
bodies.set("wasp", {
	species: ["beedrill"],
	adj: ["wasp", "hornet"],
	plural: "wasps"
})
bodies.set("bee", {
	species: ["combee"],
	plural: "bees"
})
bodies.set("bee_arms", {
	species: ["vespiqueen"],
	adj: ["bee with arms", "two-armed bee"],
	plural: "two-armed bees"
})
bodies.set("bug_generic", {
	species: ["paras", "parasect", "venipede", "karrablast", "escavalier"],
	adj: ["insect"],
	plural: "bugs"
})
bodies.set("gnat", {
	species: ["venonat"],
	adj: ["insect"],
	plural: "bugs"
})
bodies.set("cicada", {
	species: ["nincada", "ninjask", "shedinja"],
	plural: "cicadas"
})
bodies.set("moth", {
	species: ["venomoth", "dustox", "masquerain", "mothim", "volcarona"],
	plural: "moths"
})
bodies.set("worm", {
	species: ["diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "burmy", "grass_burmy", "sand_burmy", "trash_burmy", "wormadam", "grass_wormadam", "trash_wormadam", "sand_wormadam"],
	plural: "worms"
})
bodies.set("praying_mantis", {
	species: ["scyther", "scizor", "leavanny"],
	adj: ["praying mantis"],
	plural: "praying mantises"
})
bodies.set("beetle_biped", {
	species: ["pinsir"],
	adj: ["bipedal beetle", "two-legged beetle"],
	plural: "bipedal beetles"
})
bodies.set("ladybug_with_arms", {
	species: ["ledyba", "ledian"],
	adj: ["ladybug with arms"],
	plural: "ladybugs with arms",
	arms: 4
})
bodies.set("spider", {
	species: ["spinarak", "ariados", "surskit", "joltik", "galvantula"],
	plural: "spiders"
})
bodies.set("dragonfly", {
	species: ["yanma", "vibrava", "yanmega"],
	plural: "dragonflies"
})
bodies.set("flying_scorpion", {
	species: ["gligar", "gliscor"],
	adj: ["flying scorpion", "winged scorpion"],
	plural: "flying scorpions"
})
bodies.set("scorpion", {
	species: ["skorupi", "drapion"],
	plural: "scorpions"
})
bodies.set("stag_beetle", {
	species: ["heracross"],
	adj: ["stag beetle"],
	plural: "stag beetles"
})
bodies.set("ant", {
	species: ["trapinch", "durant"],
	plural: "ants"
})
bodies.set("lightning_bug", {
	species: ["volbeat", "illumise"],
	adj: ["lightning bug"],
	plural: "lightning bugs"
})
bodies.set("cricket", {
	species: ["kricketune", "kricketot"],
	plural: "crickets"
})
bodies.set("pillbug", {
	species: ["whirlipede"],
	plural: "pillbugs"
})
bodies.set("bug_taur", {
	species: ["scolipede"],
	adj: ["four-legged insect", "quadrupedal insect"],
	plural: "quadrupedal insects"
})

// avian
bodies.set("bird", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "natu", "xatu", "skarmory", "ho-oh", "lugia", "shadow_lugia", "taillow", "swellow", "swablu", "latias", "latios", "starly", "cresselia", "pidove", "tranquill", "unfezant", "sigilyph", "archen", "archeops", "fletchling", "fletchinder", "yveltal"],
	adj: ["bird", "avian"],
	plural: "birds"
})
bodies.set("bird_bipedal", {
	species: ["delibird", "hawlucha"],
	adj: ["bipedal bird", "two-legged bird", "bipedal avian", "two-legged avian"],
	plural: "bipedal birds",
	arms: 2
})
bodies.set("eagle", {
	species: ["rufflet", "braviary", "therian_tornadus"],
	plural: "eagles"
})
bodies.set("vulture", {
	species: ["vullaby", "mandibuzz"],
	plural: "vultures"
})
bodies.set("parrot", {
	species: ["chatot"],
	plural: "parrots"
})
bodies.set("falcon", {
	species: ["staraptor", "staravia", "talonflame"],
	plural: "falcons"
})
bodies.set("swan", {
	species: ["altaria", "swanna"],
	plural: "swans",
})
bodies.set("seagull", {
	species: ["wingull"],
	adj: ["sea gull"],
	plural: "sea gulls"
})
bodies.set("pelican", {
	species: ["pelipper"],
	adj: ["pelican"],
	plural: "pelicans"
})
bodies.set("chicken", {
	species: ["torchic"],
	plural: "chickens"
})
bodies.set("chicken_bipedal", {
	species: ["combusken", "blaziken"],
	adj: ["bipedal chicken"],
	plural: "bipedal chickens"
})
bodies.set("duck", {
	species: ["ducklett"],
	plural: "ducks",
})
bodies.set("duck_bipedal", {
	species: ["psyduck", "golduck", "farfetch'd", "galarian_farfetch'd"],
	adj: ["bipedal duck"],
	plural: "bipedal ducks",
	arms: 2
})
bodies.set("two_headed_ostrich", {
	species: ["doduo"],
	adj: ["two-headed ostrich"],
	plural: "two-headed ostriches",
})
bodies.set("three_headed_ostrich", {
	species: ["dodrio"],
	adj: ["three-headed ostrich"],
	plural: "three-headed ostriches"
})
bodies.set("pterodactyl", {
	species: ["aerodactyl"],
	plural: "pterodactyls"
})
bodies.set("owl", {
	species: ["hoothoot", "noctowl"],
	plural: "owls"
})
bodies.set("crow", {
	species: ["murkrow", "honchkrow"],
	plural: "crows"
})
bodies.set("penguin", {
	species: ["piplup", "prinplup", "empoleon"],
	plural: "penguins"
})

// mammal
bodies.set("mouse", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "pichu", "marill", "azurill", "plusle", "minun", "dedenne"],
	adj: ["mouse", "rodent"],
	plural: "mice",
	arms: 2
})
bodies.set("shrew", {
	species: ["sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash"],
	adj: ["shrew-like"],
	plural: "shrews"
})
bodies.set("rhino_quad", {
	species: ["nidoran_f", "nidorina", "nidoran_m", "nidorino", "rhydon", "aron", "lairon"],
	adj: ["four-legged rhino", "rhino", "quadrupedal rhino"],
	plural: "quadrupedal rhinos"
})
bodies.set("rhino_biped", {
	species: ["nidoqueen", "nidoking", "rhyhorn", "aggron", "rhyperior"],
	adj: ["two-legged rhino", "bipedal rhino"],
	plural: "bipedal rhinos",
	arms: 2
})
bodies.set("fox", {
	species: ["vulpix", "ninetails", "alolan_vulpix", "alolan_ninetales", "eevee", "vaporeon", "jolteon", "flareon", "espeon", "umbreon", "leafeon", "glaceon", "sky_shaymin", "zorua", "fennekin"],
	plural: "foxes"
})
bodies.set("fox_biped", {
	species: ["abra", "kadabra", "alakazam", "cubone", "marowak", "alolan_marowak", "sneasel", "riolu", "lucario", "weavile", "victini", "zoroark", "braixen", "delphox"],
	plural: "bipedal foxes",
	arms: 2
})
bodies.set("chinchilla", {
	species: ["minccino", "cinccino"],
	plural: "chinchillas",
	arms: 2
})
bodies.set("bear", {
	species: ["teddiursa", "ursaring", "cubchoo", "beartic"],
	plural: "bears",
	arms: 2
})
bodies.set("panda", {
	species: ["spinda", "pancham", "pangoro"],
	plural: "pandas",
	arms: 2
})
bodies.set("otter", {
	species: ["buizel", "floatzel", "oshawott", "dewott", "samurott"],
	plural: "otters",
	arms: 2
})
bodies.set("squirrel", {
	species: ["pachirisu"],
	plural: "squirrels",
	arms: 2
})
bodies.set("sugar_glider", {
	species: ["emolga"],
	adj: ["sugar glider"],
	plural: "sugar gliders",
	arms: 2
})
bodies.set("bat", {
	species: ["zubat", "golbat", "crobat", "woobat", "swoobat", "noibat"],
	plural: "bats"
})
bodies.set("cat_biped", {
	species: ["meowth", "galarian_meowth", "alolan_meowth", "snorlax", "mewtwo", "mew", "munchlax", "espurr", "m_meowstic", "f_meowstic"],
	adj: ["bipedal cat", "two-legged cat"],
	plural: "bipedal cats",
	arms: 2
})
bodies.set("cat_quad", {
	species: ["persian", "alolan_persian", "skitty", "delcatty", "glameow", "purugly", "purrloin", "liepard", "sylveon"],
	adj: ["cat", "feline"],
	plural: "cats"
})
bodies.set("lion", {
	species: ["shinx", "luxio", "luxray", "therian_landorus", "litleo", "pyroar"],
	plural: "lions"
})
bodies.set("saber_tooth_cat", {
	species: ["raikou"],
	adj: ["saber-toothed cat"],
	plural: "saber-toother cats"
})
bodies.set("monkey", {
	species: ["mankey", "primeape", "vigoroth", "chimchar", "monferno", "infernape", "ambipom", "pansage", "simisage", "panpour", "simipour", "pansear", "simisear", "darumaka", "galarian_darumaka", "darmanitan", "galarian_darmanitan"],
	plural: "monkeys",
	arms: 2
})
bodies.set("gorilla", {
	species: ["slaking"],
	plual: "gorillas",
	arms: 2
})
bodies.set("sloth", {
	species: ["slakoth"],
	plural: "sloths",
	arms: 2
})
bodies.set("canine", {
	species: ["growlithe", "arcanine", "houndour", "houndoom", "entei", "suicune", "poochyena", "mightyena", "electrike", "manectric", "absol", "lillipup", "herdier", "stoutland", "zygarde_10"],
	adj: ["canine", "dog"],
	plural: "dogs"
})
bodies.set("poodle", {
	species: ["furfrou"],
	adj: ["poodle", "dog", "canine"],
	plural: "poodles"
})
bodies.set("humanoid", {
	species: ["machop", "machoke", "machamp", "hitmonlee", "hitmonchan", "mr._mime", "galarian_mr._mime", "jynx", "electabuzz", "magmar", "tyrogue", "hitmontop", "smoochum", "elekid", "magby", "ralts", "kirlia", "gardevoir", "makuhita", "hariyama", "meditite", "medicham", "snorunt", "jirachi", "deoxys", "attack_deoxys", "defense_deoxys", "speed_deoxys", "mime_jr.", "electivire", "magmortar", "gallade", "regigigas", "timburr", "gurdurr", "conkeldurr", "throh", "sawk", "scraggy", "scrafty", "gothita", "gothorita", "gothitelle", "mienfoo", "mienshao", "pawniard", "bisharp", "meloetta", "zygarde_100"],
	adj: ["humanoid", "human-like"],
	plural: "humanoids",
	arms: 2
})
bodies.set("horse", {
	species: ["ponyta", "rapidash"],
	adj: ["equine", "horse"],
	plural: "horses"
})
bodies.set("zebra", {
	species: ["blitzle", "zebstrika"],
	adj: ["zebra", "equine", "horse"],
	plural: "zebras"
})
bodies.set("unicorn", {
	species: ["galarian_ponyta", "galarian_rapidash", "keldeo"],
	plural: "unicorns"
})
bodies.set("pig", {
	species: ["slowpoke", "galarian_slowpoke", "lickitung", "swinub", "piloswine", "spoink", "grumpig", "lickilicky", "tepig"],
	plural: "pigs"
})
bodies.set("pig_bipedal", {
	species: ["slowbro", "galarian_slowbro", "slowking", "galarian_slowking", "pignite", "emboar"],
	adj: ["bipedal pig"],
	plural: "bipedal pigs",
	arms: 2
})
bodies.set("tapir_bipedal", {
	species: ["drowzee", "hypno"],
	adj: ["bipedal tapir"],
	plural: "bipedal tapirs",
	arms: 2
})
bodies.set("bull", {
	species: ["tauros"],
	plural: "bulls"
})
bodies.set("buffalo", {
	species: ["bouffalant"],
	plural: "buffalo"
})
bodies.set("cow", {
	species: ["miltank"],
	plural: "cows"
})
bodies.set("echidna", {
	species: ["cyndaquil"],
	plural: "echidnas"
})
bodies.set("hedgehog", {
	species: ["land_shaymin", "chespin", "quilladin", "chesnaught"],
	plural: "hedgehogs"
})
bodies.set("ferret", {
	species: ["quilava", "typhlosion", "furret"],
	plural: "ferrets",
	arms: 2
})
bodies.set("muskrat", {
	species: ["watchog", "patrat"],
	plural: "muskrats",
	arms: 2
})
bodies.set("raccoon", {
	species: ["sentret", "smeargle", "zigzagoon", "linoone", "galarian_zigzagoon", "galarian_linoone"],
	plural: "raccoons",
	arms: 2
})
bodies.set("sheep", {
	species: ["mareep"],
	plural: "sheep"
})
bodies.set("sheep_biped", {
	species: ["flaaffy", "ampharos"],
	adj: ["bipedal sheep", "two-legged sheep"],
	plural: "bipedal sheep"
})
bodies.set("rabbit_biped", {
	species: ["azumarill", "buneary", "lopunny", "bunnelby", "diggersby"],
	adj: ["bipedal rabbit", "two-legged rabbit"],
	plural: "bipedal rabbits"
})
bodies.set("giraffe", {
	species: ["girafarig"],
	plural: "giraffes"
})
bodies.set("bulldog_biped", {
	species: ["snubbull", "granbull"],
	adj: ["bipedal bulldog", "two-legged bulldog"],
	plural: "bipedal bulldogs"
})
bodies.set("elephant", {
	species: ["phanpy", "donphan"],
	plural: "elephants"
})
bodies.set("deer", {
	species: ["stantler", "arceus", "spring_deerling", "summer_deerling", "autumn_deerling", "winter_deerling", "sawsbuck", "cobalion", "terrakion", "virizion", "xerneas"],
	adj: ["deer", "cervid"],
	plural: "deer"
})
bodies.set("camel", {
	species: ["numel", "camerupt"],
	plural: "camels"
})
bodies.set("mongoose", {
	species: ["zangoose"],
	plural: "mongooses"
})
bodies.set("walrus", {
	species: ["spheal", "sealeo", "walrein"],
	plural: "walruses"
})
bodies.set("beaver", {
	species: ["bidoof", "bibarel"],
	plural: "beavers",
	arms: 2
})
bodies.set("skunk", {
	species: ["stunky", "skuntank"],
	plural: "skunks"
})
bodies.set("hippo", {
	species: ["hippopotas", "hippowdon"],
	plural: "hippos"
})
bodies.set("mammoth", {
	species: ["mamoswine"],
	plural: "mammoths"
})
bodies.set("mole", {
	species: ["drillbur", "excadrill"],
	plural: "moles"
})
bodies.set("anteater", {
	species: ["heatmor"],
	plural: "anteaters"
})
bodies.set("goat", {
	species: ["skiddo", "gogoat"],
	plural: "goats"
})

// invertabrates
bodies.set("slug", {
	species: ["slugma"],
	plural: "slugs"
})
bodies.set("snail", {
	species: ["magcargo"],
	plural: "snails"
})

// magical
bodies.set("fairy", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "chansey", "cleffa", "igglybuff", "togepi", "togetic", "wobbuffet", "blissey", "celebi", "whismur", "loudred", "exploud", "mawile", "happiny", "togekiss", "uxie", "mesprit", "azelf", "audino", "accelgor", "incarnate_landorus", "incarnate_tornadus", "incarnate_thundurus", "therian_thundurus", "aromatisse", "slurpuff", "hoopa_unbound", "hoopa_confined"],
	plural: "fairies",
	arms: 2
})
bodies.set("fairy_limbless", {
	species: ["dunsparce", "gulpin", "swalot", "munna", "musharna", "shelmet", "spritzee", "swirlix"],
	adj: ["limbless fairy"],
	plural: "limbless fairies"
})
bodies.set("fairy_armless", {
	species: ["wynaut"],
	adj: ["armless fairy"],
	plural: "armless fairies"
})
bodies.set("trash_golem", {
	species: ["trubbish", "garbodor"],
	adj: ["trash golem"],
	plural: "trash golems"
})

// mineral
bodies.set("floating_rock", {
	species: ["geodude", "alolan_geodude", "koffing", "weezing", "galarian_weezing", "forretress", "lunatone", "solrock", "diancie"],
	adj: ["floating rock"],
	plural: "floating rocks",
	arms: 2
})
bodies.set("rock_golem", {
	species: ["graveler", "alolan_graveler", "golem", "alolan_golem", "nosepass", "baltoy", "claydol", "regirock", "probopass", "boldore", "gigalith", "elgyem", "beheeyem", "golett", "golurk"],
	adj: ["rock golem"],
	plural: "rock golems",
	arms: 2
})
bodies.set("rock_armless", {
	species: ["roggenrola", "zen_darmanitan", "carbink"],
	adj: ["rock golem"],
	plural: "rock golems"
})

// ice
bodies.set("floating_iceball", {
	species: ["glalie"],
	adj: ["floating ball of ice"],
	plural: "floating ball of ice"
})
bodies.set("ice_golem", {
	species: ["regice", "froslass", "bergmite", "avalugg"],
	adj: ["ice golem"],
	plural: "ice golems",
	arms: 2
})
bodies.set("snow_golem", {
	species: ["galarian_zen_darmanitan"],
	adj: ["snow golem"],
	plural: "snow golems"
})
bodies.set("ice_cream_cone", {
	species: ["vanillish", "vanillite", "vanilluxe"],
	adj: ["ice cream cone", "ice cream"],
	plural: "ice cream cones"
})
bodies.set("snowflake", {
	species: ["cryogonal"],
	plural: "snowflakes"
})

// lightning
bodies.set("lightning_spirit", {
	species: ["rotom"],
	adj: ["lightning spirit"],
	plural: "lightning spirits"
})

// robots
bodies.set("robot", {
	species: ["magnemite", "magneton", "voltorb", "electrode", "porygon", "porygon2", "beldum", "magnezone", "porygon_z", "klink", "klang", "klinklang"],
	plural: "robots"
})
bodies.set("robot_2arms", {
	species: ["metang", "registeel", "genesect"],
	adj: ["two-armed floating robot"],
	plural: "two-armed floating robots"
})
bodies.set("robot_4arms", {
	species: ["metagross"],
	adj: ["four-armed floating robot"],
	plural: "four-armed floating robots"
})

// plant
bodies.set("weed", {
	species: ["oddish"],
	adj: ["weed-like"],
	plural: "weeds"
})
bodies.set("flower", {
	species: ["gloom", "vileplume", "bellossom", "sunflora", "roselia", "lileep", "cradily", "budew", "roserade", "petilil", "lilligant", "flabebe", "floette", "florges"],
	plural: "flowers"
})
bodies.set("berry", {
	species: ["cherubi"],
	plural: "berries"
})
bodies.set("pitcher_plant", {
	species: ["bellsprout", "weepinbell", "victreebel"],
	adj: ["pitcher plant"],
	plural: "pitcher plants",
})
bodies.set("tree", {
	species: ["exeggutor", "alolan_exeggutor", "sudowoodo", "nuzleaf", "shiftry", "bonsly", "snover", "abomasnow", "phantump", "trevenant"],
	plural: "trees",
	arms: 2
})
bodies.set("pumpkin", {
	species: ["pumpkaboo", "gourgeist"],
	plural: "pumpkins",
	arms: 2
})
bodies.set("vine_golem", {
	species: ["tangela", "tangrowth"],
	adj: ["cluter of vines"],
	plural: "cluters of vines"
})
bodies.set("plant_fairy", {
	species: ["hoppip", "skiploom", "jumpluff", "whimsicott"],
	adj: ["plant fairy"],
	plural: "plant faries"
})
bodies.set("seed", {
	species: ["sunkern", "seedot", "ferroseed", "ferrothorn"],
	plural: "seeds"
})
bodies.set("pinecone", {
	species: ["pineco"],
	adj: ["pine cone"],
	plural: "pine cones"
})
bodies.set("coral", {
	species: ["corsola", "galarian_corsola"],
	plural: "corals"
})
bodies.set("mushroom", {
	species: ["shroomish", "foongus", "amoongus"],
	plural: "mushrooms"
})
bodies.set("mushroom_biped", {
	species: ["breloom"],
	adj: ["bipedal mushroom", "two-legged mushroom"],
	plural: "bipedal mushrooms",
	arms: 2
})
bodies.set("cactus", {
	species: ["cacnea", "cacturne", "maractus"],
	plural: "cactuses"
})
bodies.set("venus_flytrap", {
	species: ["carnivine"],
	adj: ["venus flytrap"],
	plural: "venus flytraps"
})
bodies.set("cottonball", {
	species: ["cottonee"],
	adj: ["cotton ball"],
	plural: "cotton balls"
})

// inanimate
bodies.set("eggs", {
	species: ["exeggcute"],
	adj: ["cluster of eggs"],
	plural: "clusters of eggs"
})
bodies.set("symbol", {
	species: ["unown"],
	adj: ["magical floating symbol"],
	plural: "magical floating symbols"
})
bodies.set("cloud", {
	species: ["castform", "rainy_castform", "snowy_castform", "sunny_castform"],
	plural: "clouds"
})
bodies.set("windchime", {
	species: ["chimecho"],
	plural: "windchimes"
})
bodies.set("bell", {
	species: ["chingling", "bronzong"],
	plural: "bells"
})
bodies.set("coin", {
	species: ["bronzor"],
	plural: "coins"
})
bodies.set("balloon", {
	species: ["drifloon"],
	plural: ["balloons"]
})
bodies.set("hot_air_balloon", {
	species: ["drifblim"],
	adj: ["hot air balloon"],
	plural: "hot air balloons"
})
bodies.set("conventional_oven", {
	species: ["heat_rotom"],
	adj: ["conventional oven", "oven"],
	plural: "conventional ovens"
})
bodies.set("washing_machine", {
	species: ["wash_rotom"],
	adj: ["washing mashine"],
	plural: "washing machines"
})
bodies.set("refrigerator", {
	species: ["frost_rotom"],
	adj: ["refrigerator", "fridge"],
	plural: "refrigerators"
})
bodies.set("electric_fan", {
	species: ["fan_rotom"],
	adj: ["electric fan", "fan", "small fan"],
	plural: "electric fans"
})
bodies.set("lawn_mower", {
	species: ["mow_rotom"],
	adj: ["lawn mower"],
	plural: "lawn mowers"
})
bodies.set("pokedex", {
	species: ["dex_rotom"],
	adj: ["animated pokedex", "living pokedex"],
	plural: "living pokedexes"
})
bodies.set("phone", {
	species: ["phone_rotom"],
	adj: ["animated phone", "living phone"],
	plural: "living phones"
})
bodies.set("candle", {
	species: ["litwick"],
	plural: "candles"
})
bodies.set("gas_lamp", {
	species: ["lampent"],
	adj: ["gas lamp"],
	plural: "gas lamps"
})
bodies.set("chandelier", {
	species: ["chandelure"],
	plural: "chanedliers"
})
bodies.set("bear_trap", {
	species: ["galarian_stunfisk"],
	adj: ["bear trap"],
	plural: "bear traps"
})
bodies.set("sword", {
	species: ["honedge"],
	adj: ["floating sword"],
	plural: "floating sword"
})
bodies.set("two_swords", {
	species: ["duoblade"],
	adj: ["floating swords"],
	plural: "floating swords"
})
bodies.set("sword_and_shield", {
	species: ["aegislash"],
	adj: ["floating sword and shield"],
	plural: "floating sword and shield"
})
bodies.set("keyring", {
	species: ["klefki"],
	adj: ["key ring"],
	plural: "key rings"
})

// slime
bodies.set("ooze", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk", "ditto"],
	adj: ["ooze creature"],
	plural: "ooze creatures"
})
bodies.set("slimeball", {
	species: ["solosis", "duosion", "goomy", "sliggoo"],
	adj: ["slime ball"],
	plural: "slime balls"
})
bodies.set("slime_creature", {
	species: ["reuniclus"],
	adj: ["slime creature"],
	plural: "slime creatures",
	arms: 2
})

// ghosts
bodies.set("ghost", {
	species: ["gastly", "misdreavus", "duskull", "spiritomb", "yamask", "galarian_yamask"],
	plural: "ghosts"
})
bodies.set("ghost_arms", {
	species: ["haunter", "gengar", "sableye", "dusclops", "mismagius", "dusknoir", "darkrai"],
	plural: "ghosts",
	arms: 2
})
bodies.set("possessed_cloth", {
	species: ["shuppet"],
	adj: ["possessed cloth", "haunted cloth"],
	plural: "possessed cloths"
})
bodies.set("possessed_doll", {
	species: ["banette"],
	adj: ["possessed doll", "haunted doll"],
	plural: "possessed dolls"
})
bodies.set("possessed_coffin", {
	species: ["cofagrigus"],
	adj: ["possessed coffin", "haunted coffin"],
	plural: "possessed coffins"
})

/*
bodies.set("", {
	species: [],
	adj: [],
	plural: ""
})
*/

bodies.forEach(function(value, name) {
	var uuid = "body_" + name

	// register adjectives
	adjectives.set(uuid, value.adj || [name])

	// add species tags
	var dex_entry = value.dex_literal ? value.dex_literal : "<p> look like <size> <color> " + value.plural + "."
	value.species.forEach(function(speciesName) {
		var data = getSpecies(speciesName)
		data[uuid] = true
		data.body = name
		data.body_dex_entry = dex_entry
		data.arms = value.arms || data.arms
	})
})

////////////////
// DICK TYPES //
////////////////
// adj: <ds>: dick slang
// pussy_adj: <ps>: pussy slang
// dex: <n>: species name, <ln>: lower species name, <p>: plural species name, <lp>: lower plural species name
var dicks = new Map()

dicks.set("nondescript", {
	species: [],
	adj: ["/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: ""
})

dicks.set("reptilian", {
	species: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "aerodactyl", "chikorita", "bayleef", "meganium", "larvitar", "pupitar", "tyranitar", "tropius", "bagon", "shellgon", "salamence", "groudon", "cranidos", "rampardos", "shieldon", "bastiodon", "helioptile", "heliolisk", "tyrunt", "tyrantrum", "amaura", "aurorus", "volcanion"],
	adj: ["lizard /a <ds>", "reptile /a <ds>"],
	pussy_adj: ["lizard /a <ps>", "reptile /a <ps>"],
	dex_m: "Male <lp> have a reptilian cock that slides out of a sheath when aroused. Their testicles are internal. <n> penises are pink and slick. The male <lp>'s penis is also highly muscular.",
	dex_f: "Female <lp> have a reptilian pussy. It looks like a slit. A female <ln>'s reptile pussy is slick and moist. Female <lp> reptilian pussies are also smooth and muscular."
})
dicks.set("reptilian_double", {
	species: ["treecko", "grovyle", "sceptile", "kecleon"],
	adj: ["lizard /a <ds>", "reptile /a <ds>"],
	pussy: "reptilian",
	dex_m: "Male <lp> have two reptilian cocks that slide out of a sheath when aroused. Their testicles are internal. <n> twin penises are pink and slick. The male <lp>'s dual penises are also highly muscular. Male <lp> love using their double dicks at the same time. When a fucking a female partner, a male <ln> will often put one of his dicks in her pussy and put the other one of his dicks in her ass.",
	dex_f: dicks.get("reptilian").dex_f,
	plural: true
})
dicks.set("draconic", {
	species: ["charizard", "gyarados", "alolan_exeggutor", "flygon", "altaria", "heatran", "axew", "fraxure", "haxorus", "druddigon", "deino", "reshiram", "zekrom", "kyurem", "white_kyurem", "black_kyurem", "noibat", "noivern", "yveltal", "zygarde_100"],
	adj: ["knotted dragon /a <ds>", "knotted draconic /a <ds>"],
	pussy_adj: ["draconic /a <ps>", "dragon /a <ps>", "scaley /a <ps>"],
	dex_m: "Male <lp> have a draconic cock with pleasurable ridges and a hard knot at the base. Their testicles are external. When not aroused, a male <ln>'s penis is hidden in a fleshy protective sheath. The male <ln>'s dragon cock has a fleshy knot at the base which flares up and locks him into his partner when he reaches orgasm. Male <lp> also have large testicles.",
	dex_f: "Female <lp> have a dragon pussy. It looks like a slit. A female <ln>'s dragon pussy is slick and moist. Female <lp> dragon pussies are also smooth and muscular."
})
dicks.set("draconic_double", {
	species: ["dragonite", "rayquaza", "zweilous"],
	adj: ["twin knotted dragon /a <ds>", "double knotted dragon /a <ds>", "twin knotted draconic /a <ds>", "double knotted draconic /a <ds>"],
	pussy: "draconic",
	dex_m: "Male <lp> have two draconic cocks with pleasurable ridges and a hard knot at the base of each of them. Their testicles are external. When not aroused, a male <ln>'s dual penises are hidden in a fleshy protective sheath. The male <ln>'s twin dragon cocks have a fleshy knot at the base which flares up and locks him into his partner when he reaches orgasm. Male <lp> also have large testicles. Male <lp> love using both of their dragon dicks to fuck a partner at the same time.",
	dex_f: "Female <lp> have a two dragon pussies. They look like slits. A female <ln>'s twin dragon cunts are slick and moist. Female <lp> dual dragon pussies are also smooth and muscular. Female <lp> love it when you fuck both of their pussies at once. If you fuck a female <lp>, make sure to fist one of her twin cunts while you fuck the other one.",
	plural: true,
	pussy_plural: true
})
dicks.set("draconic_triple", {
	species: ["hydreigon"],
	adj: ["triple knotted dragon /a <ds>", "three knotted dragon /a <ds>", "three knotted draconic /a <ds>", "triple knotted draconic /a <ds>"],
	pussy: "draconic",
	dex_m: "Male <lp> have three draconic cocks with pleasurable ridges and a hard knot at the base of each of them. Their testicles are external. When not aroused, a male <ln>'s triple penises are hidden in a fleshy protective sheath. The male <ln>'s three dragon cocks each have a fleshy knot at the base which flares up and locks him into his partner when he reaches orgasm. Male <lp> also have large testicles. Male <lp> love using all three of their dragon dicks to fuck a partner at the same time.",
	dex_f: "Female <lp> have a three dragon pussies. They look like slits. A female <ln>'s triple dragon cunts are slick and moist. Female <lp> three dragon pussies are also smooth and muscular. Female <lp> love it when you fuck all three of their pussies at once. If you fuck a female <lp>, make sure to play with all three of her cunts.",
	plural: true,
	pussy_plural: true
})
dicks.set("turtle", {
	species: ["squirtle", "wartortle", "blastoise", "shuckle", "torkoal", "turtwig", "grotle", "torterra", "tirtouga", "carracosta"],
	adj: ["turtle /a <ds>", "prehensile /a <ds>", "muscular /a <ds>"],
	pussy: "reptilian",
	dex_m: "Male <lp> have a long, pink, slick cock that hides inside their body when not in use. Their penises are prehensile and they can move them freely. <p> have internal testicles."
})
dicks.set("insect", {
	species: ["caterpie", "metapod", "butterfree", "weedle", "metapod", "paras", "parasect", "venonat", "venomoth", "pinsir", "kabuto", "kabutops", "ledyba", "ledian", "yanma", "wurmple", "silcoon", "beautifly", "cascoon", "dustox", "surskit", "masquerain", "volbeat", "illumise", "trapinch", "vibrava", "anorith", "armaldo", "kricketot", "kricketune", "burmy", "grass_burmy", "sand_burmy", "trash_burmy", "wormadam", "grass_wormadam", "trash_wormadam", "sand_wormadam", "mothim", "combee", "vespiqueen", "skorupi", "drapion", "yanmega", "sewaddle", "swadloon", "leavanny", "venipede", "whirlipede", "scolipede", "karrablast", "escavalier", "joltik", "galvantula", "durant", "larvesta", "volcarona", "genesect", "scatterbug", "spewpa", "vivillon"],
	adj: ["/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex_m: "Male <lp> have a cock that comes out of their chitinous exoskeleton when aroused. Their testicles are internal. When a male <ln> is aroused his penis leaks a sticky, sweet-smelling precum."
})
dicks.set("avian", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "psyduck", "golduck", "farfetch'd", "galarian_farfetch'd", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "hoothoot", "noctowl", "natu", "xatu", "murkrow", "delibird", "skarmory", "ho-oh", "torchic", "combusken", "blaziken", "taillow", "swellow", "wingull", "pelipper", "swablu", "piplup", "prinplup", "empoleon", "starly", "staravia", "staraptor", "honchkrow", "chatot", "pidove", "tranquill", "unfezant", "archeops", "archen", "ducklett", "swanna", "rufflet", "braviary", "vullaby", "mandibuzz", "fletchling", "fletchinder", "talonflame", "spritzee", "aromatisse", "hawlucha"],
	adj: ["bird /a <ds>", "avian /a <ds>", "muscular /a <ds>", "curved /a <ds>"],
	pussy_adj: ["avian /a <ps>", "bird /a <ps>", "feathered /a <ps>", "muscular /a <ps>"],
	dex_m: "Male <lp> have a slick, pink, curved cock. Male <lp> have internal testicles. The s-shaped curve of a male <lp>'s muscular penis is highly pleasurable."
})
dicks.set("avian_double", {
	species: ["doduo"],
	adj: ["bird /a <ds>", "avian /a <ds>", "muscular /a <ds>", "curved /a <ds>"],
	pussy: "avian",
	dex_m: "Male <lp> have two slick, pink, curved cocks. Both of the male <ln>'s penises hide inside his body when not in use. Male <lp> have internal testicles. Male <lp> are known for using both of their penises at once on a partner. They love fucking their partner with both of their dicks.",
	plural: true,
	pussy_plural: true
})
dicks.set("avian_triple", {
	species: ["dodrio"],
	adj: ["bird /a <ds>", "avian /a <ds>", "muscular /a <ds>", "curved /a <ds>"],
	pussy: "avian",
	dex_m: "Male <lp> have three slick, pink, curved cocks. All three of the male <ln>'s penises hide inside his body when not in use. Male <lp> have internal testicles. Male <lp> are known for using all three of their penises at once on a partner. They love fucking their partner with all three of their dicks.",
	plural: true,
	pussy_plural: true
})
dicks.set("snake", {
	species: ["ekans", "arbok", "onix", "dratini", "dragonair", "steelix", "seviper", "snivy", "servine", "serperior", "zygarde_50"],
	adj: ["snake /a <ds>", "twin /a <ds>", "double /a <ds>", "dual /a <ds>"],
	pussy: "reptilian",
	dex_m: "Male <lp> have two reptilian penises right beside each other. Their dual penises are slick and pink, and they retract inside the body when not in use. Male <lp> have internal testicles. Male <lp> are known for using both of their penises at once on a partner. They love fucking their partner with both of their dicks.",
	plural: true,
	pussy_plural: true
})
dicks.set("rhino", {
	species: ["nidoran_f", "nidorina", "nidoqueen", "nidoran_m", "nidorino", "nidoking", "rhyhorn", "rhydon", "aron", "lairon", "aggron", "rhyperior"],
	adj: ["rhino /a <ds>", "rhinoceros /a <ds>"],
	pussy_adj: ["rhino /a <ps>", "rhinoceros /a <ps>"],
	dex_m: "Male <lp> have a long pink penis with a dramatically flared tip. When they're about to cum, the tip of their penis flares up and expands. A <ln>'s penis is also prehensile and can be fully controlled. When not in use, the penis is hidden inside a protective fleshy sheath."
})
dicks.set("generic_sheath", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "zubat", "golbat", "chansey", "kangaskhan", "electabuzz", "magmar", "chikorita", "quilava", "typhlosion", "sentret", "furret", "crobat", "pichu", "cleffa", "igglybuff", "marill", "azumarill", "dunsparce", "gligar", "sneasel", "smeargle", "elekid", "magby", "blissey", "whismur", "loudred", "exploud", "pachirisu", "buizel", "floatzel", "stunky", "skuntank", "happiny", "snover", "abomasnow", "weavile", "electivire", "magmortar", "gliscor", "land_shaymin", "oshawott", "dewott", "samurott", "patrat", "watchog", "munna", "musharna", "swoobat", "woobat", "audino", "cottonee", "whimsicott", "minccino", "cinccino", "emolga", "shelmet", "accelgor", "mienfoo", "mienshao", "heatmor", "chespin", "quilladin", "chesnaught", "swirlix", "slurpuff"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy_adj: ["animal /a <ps>", "animalistic /a <ps>", "beast /a <ps>", "beastial /a <ps>"],
	dex_m: "Male <lp> have a pink penis that lies inside a protective fleshy sheath. When aroused, the penis comes out of its sheath. Once a male <ln> is aroused he will want to orgasm.",
})
dicks.set("generic_slit", {
	species: ["poliwag", "poliwhirl", "poliwrath", "politoed", "wooper", "quagsire", "togepi", "lotad", "lombre", "ludicolo", "gulpin", "swalot", "croagunk", "toxicroak", "tympole", "palpitoad", "seismitoad", "pawniard", "bisharp", "froakie", "frogadier", "greninja", "binacle", "barbaracle"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>", "muscular /a <ds>", "twitching /a <ds>"],
	pussy: "generic_sheath",
	dex_m: "Male <lp> have a slick, pink penis that hides inside their body when not aroused. They also have internal testicles. A male <ln>'s penis is highly muscular."
})
dicks.set("rabbit", {
	species: ["buneary", "lopunny", "bunnelby", "diggersby"],
	adj: ["bunny /a <ds>", "rabbit /a <ds>"],
	pussy_adj: ["bunny /a <ps>", "rabbit /a <ps>"],
	dex_m: dicks.get("generic_sheath").dex_m + " <n>'s cock is extremely soft.",
	dex_f: dicks.get("generic_sheath").dex_f + " <n>'s pussy is extremely soft."
})
dicks.set("mole", {
	species: ["drillbur", "excadrill"],
	adj: ["mole /a <ds>", "animal /a <ds>", "beastial /a <ds>", "beast /a <ds>", "animalistic /a <ds>"],
	pussy: "generic_sheath",
	dex_m: "A male <ln>'s penis has four heads. Male <lp> love it when you play with all four of their cock heads. A male <ln>'s four cock heads are its most sensitive spots."
})
dicks.set("rodent", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash", "plusle", "minun", "dedenne"],
	adj: ["mouse /a <ds>", "animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_sheath",
	dex_m: dicks.get("generic_sheath").dex_m,
	dex_f: dicks.get("generic_sheath").dex_f
})
dicks.set("beaver", {
	species: ["bidoof", "bibarel"],
	adj: ["beaver /a <ds>", "animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_sheath",
	dex_m: dicks.get("generic_sheath").dex_m + ` <n> have enormous testicles.`,
	dex_f: dicks.get("generic_sheath").dex_f
})
dicks.set("fox", {
	species: ["vulpix", "alolan_vulpix", "ninetales", "alolan_ninetales", "abra", "kadabra", "alakazam", "cubone", "marowak", "alolan_marowak", "eevee", "jolteon", "flareon", "espeon", "umbreon", "riolu", "lucario", "leafeon", "glaceon", "sky_shaymin", "victini", "zorua", "zoroark", "fennekin", "braixen", "delphox"],
	adj: ["fox /a <ds>", "vulpine /a <ds>", "animal /a <ds>", "beastial /a <ds>", "beast /a <ds>", "animalistic /a <ds>"],
	pussy_adj: ["fox /a <ps>", "vulpine /a <ps>"],
	dex_m: dicks.get("generic_sheath").dex_m + " At the base of a <ln>'s penis is a thick fleshy knot, which expands when he's getting close to orgasm."
})
dicks.set("vine", {
	species: ["oddish", "gloom", "vileplume", "bellsprout", "weepinbell", "victreebel", "exeggutor", "tangela", "bellossom", "hoppip", "skiploom", "jumpluff", "sunkern", "sunflora", "pineco", "forretress", "celebi", "shroomish", "breloom", "roselia", "cacnea", "cacturne", "lileep", "cradily", "roselia", "roserade", "cherubi", "sunny_cherrim", "overcast_cherrim", "bonsly", "carnivine", "tangrowth", "petilil", "lilligant", "maractus", "foongus", "amoongus", "ferroseed", "ferrothorn", "flabebe", "floette", "florges", "phantump", "trevenant", "pumpkaboo", "gourgeist"],
	adj: ["several slimey vine /a <ds>", "many slimey vine /a <ds>", "several slimey tentacle /a <ds>", "many slimey tentacle /a <ds>", "slimey vine /a <ds>", "slimey tentacle /a <ds>"],
	pussy_adj: ["several slimey vine /a <ps>", "many slimey vine /a <ps>", "several slimey tentacle /a <ps>", "many slimey tentacle /a <ps>", "slimey vine /a <ps>", "slimey tentacle /a <ps>"],
	dex_m: `Male <lp> have several vines which function as penises. These penis vines are long and fully prehensile. Vine cocks have a head like a human's penis, and a retractable foreskin. Vine penises are very slick and slimy, and male <lp> love to use multiple at a time to fuck their partners. Cock vines can cum just like any other penis.`,
	dex_f: `Female <lp> have several vines which function as vaginas. These pussy vines are long and fully prehensile. Vine pussies can suck on a partner's cock until they cum. Female <lp> love to use multiple vine cunts if their partner has multiple cocks.`,
	plural: true,
	pussy_plural: true
})
dicks.set("self", {
	species: ["diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "exeggcute"],
	adj: ["body"],
	pussy_adj: ["mouth"],
	dex_m: "No one knows how <lp> reproduce, but that doesn't stop people from having sex with them. They love to be shoved into people's various holes, and it seems they can have some type of orgasm from it."
})
dicks.set("feline", {
	species: ["meowth", "alolan_meowth", "galarian_meowth", "persian", "alolan_persian", "mewtwo", "mew", "raikou", "skitty", "delcatty", "shinx", "luxio", "luxray", "glameow", "purugly", "munchlax", "purrloin", "liepard", "litleo", "pyroar", "espurr", "m_meowstic", "f_meowstic"],
	adj: ["feline /a <ds>", "barbed /a <ds>", "cat /a <ds>"],
	pussy_adj: ["feline /a <ps>", "cat /a <ps>"],
	dex_m: "Male <lp> have a pink penis with soft barbs on the end. The barbs don't hurt, they feel pleasant. When not aroused, a <ln>'s penis is hidden in a protective fleshy sheath."
})
dicks.set("human", {
	species: ["mankey", "primeape", "machop", "machoke", "hitmonlee", "hitmonchan", "mr._mime", "galarian_mr._mime", "jynx", "aipom", "tyrogue", "hitmontop", "smoochum", "ralts", "kirlia", "gardevoir", "slakoth", "vigoroth", "slaking", "makuhita", "hariyama", "meditite", "medicham", "jirachi", "chimchar", "monferno", "infernape", "mime_jr.", "gallade", "regigigas", "pansage", "simisage", "panpour", "simipour", "pansear", "simisear", "timburr", "gurdurr", "conkeldurr", "throh", "sawk", "darumaka", "galarian_darumaka", "darmanitan", "galarian_darmanitan", "scraggy", "scrafty", "gothita", "gothorita", "gothitelle", "meloetta"],
	adj: ["human-like /a <ds>", "humanoid /a <ds>", "/a <ds>"],
	pussy_adj: ["human-like /a <ps>", "humanoid /a <ps>", "/a <ps>"],
	dex_m: "Male <lp> have a human-like penis complete with a foreskin and a scrotum with two testicles."
})
dicks.set("human_double", {
	species: ["machamp", "ambipom"],
	adj: ["twin /a <ds>", "double /a <ds>", "dual /a <ds>"],
	pussy_adj: ["twin /a <ps>", "double /a <ps>", "dual /a <ps>"],
	dex_m: "Male <lp> have two large penises. When fucking females they love to put their cocks in both holes at once. The two big penises of male <lp> are veiny and muscular. The male <lp> love penetrating their partner with both of their penises at once.",
	plural: true,
	pussy_plural: true
})
dicks.set("canine", {
	species: ["growlithe", "arcanine", "snubbull", "granbull", "houndour", "houndoom", "suicune", "entei", "poochyena", "mightyena", "electrike", "manectric", "absol", "lillipup", "herdier", "stoutland", "furfrou", "sylveon", "zygarde_10"],
	adj: ["knotted dog /a <ds>", "knotted canine /a <ds>", "knotted doggy /a <ds>", "knotted puppy /a <ds>", "knotted /a <ds>"],
	pussy_adj: ["dog /a <ps>", "canine /a <ps>", "puppy /a <ps>"],
	dex_m: "Male <lp> have a pink dog penis. A male <p>'s penis has a thick fleshy knot at the base, which expands and lodges him inside his partner when he orgasms. Once a male <ln> has knotted his partner, they'll be stuck together until his penis goes soft again. When his penis isn't in use, it's hidden in a protective fleshy sheath."
})
dicks.set("tentacle", {
	species: ["tentacool", "tentacruel", "omanyte", "omastar", "octillery", "clamperl", "deoxys", "speed_deoxys", "attack_deoxys", "defense_deoxys", "west_shellos", "east_shellos", "west_gastrodon", "east_gastrodon", "darkrai", "m_frillish", "f_frillish", "m_jellicent", "f_jellicent", "inkay", "malamar"],
	adj: ["several slimey tentacle /a <ds>", "several writhing tentacle /a <ds>", "many slimey tentacle /a <ds>", "many writhing tentacle /a <ds>", "slimey tentacle /a <ds>", "writhing tentacle /a <ds>", "tentacle /a <ds>"],
	pussy_adj: ["several slimey tentacle /a <ps>", "several writhing tentacle /a <ps>", "many slimey tentacle /a <ps>", "many writhing tentacle /a <ps>", "slimey tentacle /a <ps>", "writhing tentacle /a <ps>", "tentacle /a <ps>"],
	dex_m: `Male <lp> have several tentacles. One of their tentacles is actually their penis. A male <ln>'s penis tentacle looks like any other tentacle, but it releases cum when he orgasms. When a male <ln> has sex, he uses all his tentacles to pleasure his partner.`,
	dex_f: `Female <lp> have several tentacles. One of the female <lp>'s tentacles is actually its vagina. A female <ln>'s pussy tentacle looks like any other tentacle, but the tip can open to reveal a soft moist vagina. When female <lp> have sex, they use their tentacle cunt to suck the cum out of the male's penis.`,
	plural: true,
	pussy_plural: true
})
dicks.set("rock", {
	species: ["geodude", "graveler", "golem", "alolan_geodude", "alolan_graveler", "alolan_golem", "sudowoodo", "nosepass", "regirock", "probopass", "roggenrola", "boldore", "gigalith", "zen_darmanitan", "diancie"],
	adj: ["stone /a <ds>", "rock /a <ds>"],
	pussy_adj: ["stone /a <ps>", "rock /a <ps>"],
	dex_m: `Male <lp> have a penis made entirely out of rock. Despite the hardness of the penis, it's very warm and comfortable. Since their penises are made of rock, male <lp> are always erect and ready to fuck.`,
	dex_f: `Female <lp> have a pussy made entirely out of rock. Despite the hardness of the pussy, it's very warm and comfortable. Since their pussies are made of rock, female <lp> are always ready to fuck.`
})
dicks.set("metal", {
	species: ["registeel"],
	adj: ["metal /a <ds>", "steel /a <ds>"],
	pussy_adj: ["metal /a <ps>", "steel /a <ps>"],
	dex_m: "Male <lp> have a penis made entirely out of metal. Despite the hardness of the penis, it's very warm and comfortable. Since their penises are made of metal, male <lp> are always erect and ready to fuck.",
	dex_f: "Female <lp> have a pussy made entirely out of metal. Despite the hardness of the pussy, it's very warm and comfortable. Since their pussies are made of metal, female <lp> are always ready to fuck."
})
dicks.set("ice", {
	species: ["glalie", "regice", "froslass", "galarian_zen_darmanitan", "vanillite", "vanillish", "vanilluxe", "cryogonal", "carbink", "bergmite", "avalugg"],
	adj: ["ice /a <ds>", "icey /a <ds>"],
	pussy_adj: ["ice /a <ps>", "icey /a <ps>"],
	dex_m: "Male <lp> have a penis made entirely out of ice. Despite the coldness and hardness of the penis, it's very comfortable. Since their penises are made of ice, male <lp> are always erect and ready to fuck.",
	dex_f: "Female <lp> have a pussy made entirely out of ice. Despite the coldness and hardness of the pussy, it's very comfortable. Since their pussies are made of ice, female <lp> are always ready to fuck."
})
dicks.set("equine", {
	species: ["ponyta", "galarian_ponyta", "rapidash", "galarian_rapidash", "blitzle", "zebstrika", "cobalion", "terrakion", "virizion", "incarnate_tornadus", "therian_tornadus", "incarnate_thundurus", "therian_thundurus", "incarnate_landorus", "therian_landorus", "keldeo", "xerneas"],
	adj: ["horse /a <ds>", "equine /a <ds>", "horsecock"],
	pussy_adj: ["horse /a <ps>", "equine /a <ps>"],
	dex_m: "Male <lp> have a long horse cock. Their equine penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s horsecock has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm.",
	dex_f: "When female <lp> are aroused, their clitoris will wink in and out to signal that they're ready to fuck."
})
dicks.set("equine_knotted", {
	species: ["dialga"],
	adj: ["knotted horse /a <ds>", "knotted equine /a <ds>", "knotted horsecock"],
	pussy: "equine",
	dex_m: "Male <lp> have a long knotted horse cock. Their knotted equine penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s knotted horsecock has a muscular band around the middle, and a large flat head at the tip. The head and knot of the penis will both flare up with the pokemon reaches orgasm. When a <ln>'s knot flares up it will lock him into his partner until his penis is flaccid again.",
	dex_f: "When female <lp> are aroused, their clitoris will wink in and out to signal that they're ready to fuck."
})
dicks.set("equine_doubleknotted", {
	species: ["arceus"],
	adj: ["double-knotted horse /a <ds>", "double-knotted equine /a <ds>", "double-knotted horsecock"],
	pussy: "cervine",
	dex_m: "Male <lp> have a long horse cock with two knots. Their double-knotted equine penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s double-knotted horsecock has a muscular band around the middle, and a large flat head at the tip. The head and knots of the penis will all flare up with the pokemon reaches orgasm. When a <ln>'s knots flare up they will lock him into his partner until his penis is flaccid again. A male <ln>'s horse dick has two fleshy knots.",
	dex_f: "When female <lp> are aroused, their clitoris will wink in and out to signal that they're ready to fuck."
})
dicks.set("giraffe", {
	species: ["girafarig"],
	adj: ["giraffe /a <ds>", "giraffid /a <ds>"],
	pussy_adj: ["giraffe /a <ps>", "giraffid /a <ps>"],
	dex_m: "Male <lp> have a long giraffe cock. Their giraffe penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s giraffe dick has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm.",
	dex_f: "When female <lp> are aroused, their clitoris will wink in and out to signal that they're ready to fuck."
})
dicks.set("hippo", {
	species: ["hippopotas", "hippowdon"],
	adj: ["hippo /a <ds>", "hippopotamus /a <ds>"],
	pussy_adj: ["hippo /a <ps>", "hippopotamus /a <ps>"],
	dex_m: "Male <lp> have a long hippopotamus cock. Their hippo penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s hippopotamus dick has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm.",
	dex_f: "When female <lp> are aroused, their clitoris will wink in and out to signal that they're ready to fuck."
})
dicks.set("elephant", {
	species: ["phanpy", "donphan"],
	adj: ["elephant /a <ds>", "elephantid /a <ds>"],
	pussy_adj: ["elephant /a <ps>", "elephantid /a <ps>"],
	dex_m: "Male <lp> have a long elephant cock. Their elephant penises are normally stored within a thick fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s elephant dick has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm. A male <ln> can release over 10 gallons of semen in one orgasm!"
})
dicks.set("mammoth", {
	species: ["Mamoswine"],
	adj: ["mammoth /a <ds>", "elephantid /a <ds>"],
	pussy_adj: ["mammoth /a <ps>", "elephantid /a <ps>"],
	dex_m: "Male <lp> have a long mammoth cock. Their mammoth penises are normally stored within a thick fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s mammoth dick has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm. A male <ln> can release over 10 gallons of semen in one orgasm!"
})
dicks.set("porcine", {
	species: ["slowpoke", "galarian_slowpoke", "slowbro", "galarian_slowbro", "drowzee", "hypno", "slowking", "galarian_slowking", "swinub", "poliswine", "spoink", "grumpig", "tepig", "pignite", "emboar"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_sheath",
	dex_m: "Male <lp> have a long, thin, pink penis. A male <ln>'s penis normally hides within a protective fleshy sheath when not aroused. They also have massive testicles. A male <ln> can release over a gallon of semen in one orgasm!"
})
dicks.set("pinniped", {
	species: ["spheal", "sealeo", "walrein"],
	adj: ["walrus /a <ds>", "seal /a <ds>", "pinniped /a <ds>"],
	pussy: "generic_slit",
	dex_m: "Male <lp> have a long pink pinniped penis. A male <ln>'s seal penis normally hides within a protective fleshy sheath when not aroused. They also have massive testicles. A male <ln> can release over a gallon of semen in one orgasm!"
})
dicks.set("cervine", {
	species: ["stantler", "spring_deerling", "summer_deerling", "autumn_deerling", "winter_deerling", "sawsbuck"],
	adj: ["deer /a <ds>", "cervid /a <ds>"],
	pussy_adj: ["deer /a <ps>", "cervid /a <ps>"],
	pussy: "generic_sheath",
	dex_m: "Male <lp> have a long, thin, pink, deer penis. A male <ln>'s deer penis normally hides within a protective fleshy sheath when not aroused."
})
dicks.set("camel", {
	species: ["numel", "camerupt"],
	adj: ["camel /a <ds>", "camelid /a <ds>"],
	pussy_adj: ["camel /a <ps>", "camelid /a <ps>"],
	pussy: "generic_sheath",
	dex_m: "Male <lp> have a long camel penis. A male <ln>'s camel penis normally hides within a protective fleshy sheath when not aroused."
})
dicks.set("ursine", {
	species: ["teddiursa", "ursaring", "spinda", "cubchoo", "beartic", "pancham", "pangoro"],
	adj: ["bear /a <ds>", "ursine /a <ds>"],
	pussy_adj: ["bear /a <ps>", "ursine /a <ps>"],
	dex_m: "Male <lp> have a long, thin, pink, bear penis. A male <ln>'s bear penis normally hides within a protective fleshy sheath when not aroused."
})
dicks.set("sheep", {
	species: ["mareep", "flaaffy", "ampharos"],
	adj: ["sheep /a <ds>"],
	pussy: "generic_sheath",
	dex_m: "<p> have animalistic sheep genitals. <p> genitals are very soft and plushy, and highly sensitive. Sex with them is intensely pleasurable."
})
dicks.set("goat", {
	species: ["skiddo", "gogoat"],
	adj: ["goat /a <ds>"],
	pussy: "generic_sheath",
	dex_m: "<p> have animalistic goat genitals. <p> genitals are very soft and plushy, and highly sensitive. Sex with them is intensely pleasurable. Male <lp> have huge testicles."
})
dicks.set("electric_disembodied", {
	species: ["magnemite", "magneton", "voltorb", "electrode", "porygon", "porygon2", "magnezone", "porygon_z", "rotom", "heat_rotom", "wash_rotom", "frost_rotom", "fan_rotom", "mow_rotom", "dex_rotom", "phone_rotom", "klink", "klang", "klinklang"],
	adj: ["magically electric /a <ds>", "pleasantly electric /a <ds>", "disembodied electric /a <ds>"],
	pussy_adj: ["magical electric /a <ps>", "pleasently electric /a <ps>", "disembodied electric /a <ps>"],
	dex_m: "Male <lp> reproduce using a penis made of magical electric energy. The penis is used like a dildo, and it's voltage is low enough that it's extremely pleasurable and doesn't shock the user. Since male <lp> have magical disembodied penises, they can create more whenever they want. They love creating several electric penises during sex."
})
dicks.set("cetacean", {
	species: ["seel", "dewgong", "lapras", "vaporeon", "lanturn", "togetic", "mantine", "lugia", "latias", "latios", "mantyke", "togekiss", "cresselia"],
	adj: ["prehensile /a <ds>", "muscular /a <ds>", "cetacean /a <ds>"],
	pussy_adj: ["slick /a <ps>", "smooth /a <ps>", "cetacean /a <ps>", "muscular /a <ps>"],
	dex_m: "Male <lp> have a long, slick, pink penis. A male <ln>'s penis is prehensile and can be controlled freely. When not aroused, a male <lp>'s penis retracts into a slit in its body. Male <lp> have internal testicles. A male <ln>'s penis is extremely strong and muscular. When they cum, male <lp> can shoot semen over 30 feet!"
})
dicks.set("cetacean_knotted", {
	species: ["palkia"],
	adj: ["knotted prehensile /a <ds>", "knotted muscular /a <ds>", "knotted cetacean /a <ds>"],
	pussy_adj: ["slick /a <ps>", "smooth /a <ps>", "cetacean /a <ps>", "muscular /a <ps>"],
	dex_m: "Male <lp> have a long, slick, muscular, knotted pink penis. A male <ln>'s knotted cetacean penis is prehensile and can be controlled freely. When not aroused, a male <lp>'s penis retracts into a slit in its body. Male <lp> have internal testicles. A male <ln>'s penis is extremely strong and muscular. When they cum, male <lp> can shoot semen over 30 feet! When a male <ln> cums, his knot will inflate and lock him into his partner until he becomes flaccid again."
})
dicks.set("cetacean_double", {
	species: ["milotic"],
	adj: ["prehensile /a <ds>", "muscular /a <ds>", "cetacean /a <ds>"],
	pussy: "cetacean",
	dex_m: "Male <lp> have two long, slick, pink penises. A male <ln>'s twin penises are prehensile and can be controlled freely. When not aroused, a male <lp>'s dual penises retract into a slit in his body. Male <lp> have internal testicles. A male <ln>'s double penises are extremely strong and muscular. When they cum, male <lp> can shoot semen over 30 feet!",
	plural: true
})
dicks.set("demonic", {
	species: ["shadow_lugia"],
	adj: ["demonic /a <ds>", "demon /a <ds>"],
	pussy_adj: ["enticing /a <ps>", "hypnotizing /a <ps>", "entrancing /a <ps>"],
	dex_m: "Male <lp> have a long, thick, knotted, purple cock. A male <ln>'s demonic penis is ribbed for pleasure. The male <ln>'s demon penis has a large knot, which expands and locks him into his partner when he cums. Male <ln>'s demon penises have a pointed tip and sexy feelers all around, which provide pleasure for him and his partner. Male <lp> have gigantic testicles, and they can cum gallons of intoxicating semen in a single orgasm."
})
dicks.set("demonic_triple", {
	species: ["origin_giratina"],
	adj: ["triple knotted demonic /a <ds>", "triple knotted demon /a <ds>"],
	pussy_adj: ["triple enticing /a <ps>", "triple hypnotizing /a <ps>", "triple entrancing /a <ps>"],
	dex_m: "Male <lp> have three long, thick, knotted, purple cocks. A male <ln>'s triple demonic knotted penises are ribbed for pleasure. The male <ln>'s triple demon penises have large knots, which expand and lock him into his partner when he cums. Male <ln>'s triple demonic peniseses have a pointed tip and sexy feelers all around, which provide pleasure for him and his partner. Male <lp> have gigantic testicles, and they can cum gallons of intoxicating semen in a single orgasm.",
	dex_f: "Female <lp> have three vaginas. They love having all their of their vaginas fucked at once.",
	plural: true,
	pussy_plural: true
})
dicks.set("slime", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk", "slugma", "magcargo", "corsola", "galarian_corsola", "goomy", "sliggoo", "goodra"],
	adj: ["slime /a <ds>", "slimey /a <ds>"],
	pussy_adj: ["slime /a <ps>", "slimey /a <ps>"],
	dex_m: "Male <lp> reproduce by forming their slime into the shape of a penis and using it to fuck their partner. A <ln>'s slime penis can be reshaped and resized to do any kinky thing he wants. Male <lp> love to create multiple slime cocks at once and use them fuck a single partner."
})
dicks.set("tongue", {
	species: ["shellder", "cloyster", "lickitung", "lickilicky"],
	adj: ["tongue-/a <ds>", "tongue /a <ds>"],
	pussy_adj: ["tongue /a <ps>", "tongue-/a <ps>"],
	dex_m: "A male <ln>'s tongue is actually his penis. He has a long prehensile tongue that he uses to fuck his partner. When he reaches orgasm, the male <ln> cums from the tip of his tongue. Male <lp> love to use their tongue-cocks to perform all sorts of sex acts. <p> have very long tongues which can be finely controlled. Male <lp> love to use their tongue dicks to fuck, suck, and jerk off their partners!"
})
dicks.set("psychic_disembodied", {
	species: ["gastly", "haunter", "koffing", "weezing", "galarian_weezing", "staryu", "starmie", "misdreavus", "unown", "wobbuffet", "lunatone", "solrock", "baltoy", "claydol", "shupper", "duskull", "chimecho", "wynaut", "beldum", "metang", "metagross", "drifloon", "drifblim", "mismagius", "spiritomb", "chingling", "bronzor", "bronzong", "sigilyph", "yamask", "galarian_yamask", "cofagrigus", "solosis", "duosion", "reuniclus", "elgyem", "beheeyem", "litwick", "lampent", "chandelure", "golett", "golurk", "honedge", "duoblade", "aegislash", "klefki", "hoopa_confined", "hoopa_unbound"],
	adj: ["ethereal floating /a <ds>", "psychically floating /a <ds>"],
	pussy_adj: ["ethereal floating /a <ps>", "psychically floating /a <ps>"],
	dex_m: "Male <lp>'s lack a physical penis, but they can manifest a magical penis using psychic energy. A partner can use the male <ln>'s psychic penis like a dildo, and it can orgasm like a normal penis. Since male <lp> use disembodied psychic penises, they can create more than one. Male <lp> love to create multiple penises and fuck the same person with them."
})
dicks.set("psychic", {
	species: ["gengar", "sableye", "banette", "dusclops", "dusknoir", "uxie", "mesprit", "azelf", "trubbish", "garbodor"],
	adj: ["psychic /a <ds>", "glowing /a <ds>", "ethereal /a <ds>>"],
	pussy_adj: ["psychic /a <ps>", "glowing /a <ps>", "ethereal /a <ps>"],
	dex_m: "Male <lp> don't have physical penises, but they create them out of psychic energy when aroused. An observer would see the male <ln>'s penis phase into existence on its crotch. Since a male <ln>'s penis is created using psychic energy, it can be any shape and size! Male <lp> will change the size and shape of their psychic dicks during sex to keep things interesting for their partner."
})
dicks.set("crustacean", {
	species: ["krabby", "kingler", "corphish", "crawdaunt", "dwebble", "crustle", "clauncher", "clawitzer"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_slit",
	dex_m: "Male <lp> have an internal penis that comes out of their body when aroused."
})
dicks.set("fish", {
	species: ["horsea", "seadra", "goldeen", "seaking", "magikarp", "chinchou", "qwilfish", "remoraid", "kingdra", "mudkip", "marshtomp", "swampert", "carvanha", "barboach", "whiscash", "feebas", "huntail", "gorebyss", "relicanth", "luvdisc", "finneon", "lumineon", "phione", "manaphy", "basculin", "alomomola", "tynamo", "eelektrik", "eelektross", "stunfisk", "galarian_stunfisk", "skrelp", "dragalge"],
	adj: ["slick /a <ds>", "tapered /a <ds>", "fish /a <ds>"],
	pussy: "cetacean",
	dex_m: "Male <lp> have an internal penis that comes out of their body when aroused."
})
dicks.set("shark", {
	species: ["sharpedo", "gible", "gabite", "garchomp"],
	adj: ["dual shark /a <ds>", "double shark /a <ds>", "twin shark /a <ds>"],
	pussy_adj: ["shark /a <ps>"],
	dex_m: "Male <lp> have two shark penises. A male <ln>'s double shark dicks are slippery and pink. Male <lp> love using both of their twin shark cocks at once when having sex."
})
dicks.set("whale", {
	species: ["wailmer", "wailord", "kyogre"],
	adj: ["whale /a <ds>"],
	pussy_adj: ["whale /a <ps>"],
	dex_m: "Male <lp> have colossal whale penises. The size of a male <ln>'s penis cannot be understated. A male <ln>'s penis is over six feet long, and as thick as an entire human body. It is totally impossible for a male <ln> to fit his penis into a person.",
	dex_f: "Female <ln> have enormous vaginas that can take any size of cock, but they won't even feel a thing unless the penis is absolutely colossal."
})
dicks.set("bovine", {
	species: ["tauros", "miltank", "bouffalant"],
	adj: ["bull /a <ds>", "bovine /a <ds>"],
	pussy_adj: ["cow /a <ps>", "bovine /a <ps>"],
	dex_m: "Male <lp> have a bull penis. It's long and pink. Male <lp> also have massive testes. When a male <ln> cums, he can release over a gallon of semen!"
})
dicks.set("ditto", {
	species: ["ditto"],
	adj: ["transformable /a <ds>"],
	pussy_adj: ["transformable /a <ps>"],
	dex_m: "<p> can transform any part of their body into anything imaginable. They frequently transform during sex to keep things exciting and interesting. <p> really love to transform into the person or pokemon they're currently having sex with."
})
dicks.set("ovipositor", {
	species: ["beedrill", "spinarak", "ariados", "scyther", "scizor", "heracross"],
	adj: ["/a <ds>-like ovipositor", "ovipositor", "sexual appendage"],
	pussy: "insect",
	dex_m: "Male <lp> use a specialized ovipositor as a penis. His ovipositor functions just like a penis. When a male <p> cums, he pumps eggs through his ovipositor into his partner. He doesn't ejaculate semen, he only releases large eggs when he cums. This makes his partner feel really good."
})
dicks.set("crocodile", {
	species: ["totodile", "croconaw", "feraligatr", "sandile", "krokorok", "krookodile"],
	adj: ["crocodile /a <ds>", "croc /a <ds>", "gator /a <ds>", "crocodilian /a <ds>"],
	pussy_adj: ["crocodile /a <ps>", "croc /a <ps>", "gator /a <ps>", "crocodilian /a <ps>"],
	dex_m: "Male <lp> have a crocodile penis. The male <ln>'s crocodilian cock is extremely muscular and powerful. Male <ln> are known to fence with their crocodile dicks to display their power. Female <lp> will always choose the male with the biggest cock, so male <lp> have evolved to have big crocodile dicks."
})
dicks.set("cloud", {
	species: ["castform", "rainy_castform", "sunny_castform", "snowy_castform"],
	adj: ["cloud /a <ds>", "cloudy /a <ds>"],
	pussy_adj: ["cloud /a <ps>", "cloudy /a <ps>"],
	dex_m: "Male <lp> have a penis made entirely of clouds. The male <ln>'s cloud penis can't penetrate anything, but it can still feel pleasure."
})
dicks.set("glitchy", {
	species: ["missingno"],
	adj: ["glitchy /a <ds>", "glitch /a <ds>"],
	pussy_adj: ["glitchy /a <ps>", "glitch /a <ps>"],
	dex_m: "Male <lp> have a penis made out of glitchy cyber material.",
	dex_f: "Female <lp> have a pussy made out of glitchy cyber material."
})
/*
dicks.set("", {
	species: [],
	adj: ["/a <ds>"],
	pussy: "",
	pussy_adj: ["/a <ps>"],
	dex: ""
})
*/

dicks.forEach(function(value, name) {
	// register adjectives
	var dick_uuid = "dick_" + name
	var pussy_uuid = "pussy_" + name
	adjectives.set(dick_uuid, value.adj)
	adjectives.set(pussy_uuid, value.pussy_adj)

	// add species tags
	var dick_name = name
	var pussy_name = value.pussy || name
	var dick_tag = "dick_" + dick_name
	var pussy_tag = "pussy_" + pussy_name
	value.species.forEach(function(speciesName) {
		var data = getSpecies(speciesName)
		data[dick_tag] = true
		data[pussy_tag] = true
		data.dick = dick_name
		data.pussy = pussy_name
		data.dick_plural = dicks.get(data.dick).plural
		data.pussy_plural = dicks.get(data.dick).pussy_plural || dicks.get(data.pussy).pussy_plural
		data.dick_dex_entry = value.dex_m
		data.pussy_dex_entry = value.dex_f
		data.shared_dex_entry = value.dex
	})
})

//////////////////////////
// SPECIES SPECIAL DATA //
//////////////////////////
var special = new Map()

special.set("bulbasaur", {
	description: "The bulbasaur has a /a plant /a green bulb on its back.",
	vines: 2
})
special.set("ivysaur", {
	description: "The ivysaur has a /a plant /a pink flower bud on its back, nestled in a bush of /a green leaves.",
	vines: 2
})
special.set("venusaur", {
	description: "The venusaur has a large /a plant /a pink flower on its back. It emits an intoxicatingly arousing odor.",
	vines: 4
})
special.set("charmander", {
	description: "The charmander has a tail with a flame at the tip."
})
special.set("charmeleon", {
	description: "The charmeleon has a tail with a flame at the tip."
})
special.set("charizard", {
	description: "The charizard has powerful wings and a tail with a flame at the tip."
})
special.set("alolan_rattata", {
	subspeciesOf: "rattata"
})
special.set("alolan_raticate", {
	subspeciesOf: "raticate"
})
special.set("alolan_raichu", {
	subspeciesOf: "raichu"
})
special.set("alolan_sandshrew", {
	subspeciesOf: "sandshrew"
})
special.set("alolan_sandslash", {
	subspeciesOf: "sandslash"
})
special.set("alolan_vulpix", {
	subspeciesOf: "vulpix"
})
special.set("alolan_ninetales", {
	subspeciesOf: "ninetales"
})
special.set("alolan_diglett", {
	subspeciesOf: "diglett"
})
special.set("alolan_dugtrio", {
	subspeciesOf: "dugtrio"
})
special.set("alolan_meowth", {
	subspeciesOf: "meowth"
})
special.set("galarian_meowth", {
	subspeciesOf: "meowth"
})
special.set("alolan_persian", {
	subspeciesOf: "persian"
})
special.set("alolan_geodude", {
	subspeciesOf: "geodude"
})
special.set("alolan_graveler", {
	subspeciesOf: "graveler"
})
special.set("alolan_golem", {
	subspeciesOf: "golem"
})
special.set("machamp", {
	dex: "Machamps are extremely muscular. Male machamps have very veiny cocks and huge balls. Female machamps have large breasts. Machamps have four arms. When machamps have sex, they like to use their four arms to manipulate their partner."
})
special.set("alolan_ponyta", {
	subspeciesOf: "ponyta"
})
special.set("alolan_rapidash", {
	subspeciesOf: "rapidash"
})
special.set("galarian_slowpoke", {
	subspeciesOf: "slowpoke"
})
special.set("galarian_slowbro", {
	subspeciesOf: "slowbro"
})
special.set("galarian_farfetch'd", {
	subspeciesOf: "farfetch'd"
})
special.set("alolan_grimer", {
	subspeciesOf: "grimer"
})
special.set("alolan_muk", {
	subspeciesOf: "muk"
})
special.set("alolan_exeggutor", {
	subspeciesOf: "exeggutor"
})
special.set("alolan_marowak", {
	subspeciesOf: "marowak"
})
special.set("galarian_weezing", {
	subspeciesOf: "weezing"
})
special.set("galarian_mr._mime", {
	subspeciesOf: "mr._mime"
})
special.set("galarian_articuno", {
	subspeciesOf: "articuno"
})
special.set("galarian_zapdos", {
	subspeciesOf: "zapdos"
})
special.set("galarian_moltres", {
	subspeciesOf: "moltres"
})
special.set("aipom", {
	dex: "Aipom has a hand at the end of its tail. Aipoms love using their tail hands to jerk off the partners."
})
special.set("unown", {
	dex: "Unown are shaped like floating animated symbols. An unown can be shaped like any letter of the english alphabet. When there are several unown, they can use their bodies to spell words."
})
special.set("galarian_corsola", {
	subspeciesOf: "corsola"
})

/*
special.set("", {
	description: ""
})
*/

special.forEach(function(value, name) {
	var data = getSpecies(name)

	data.description = value.description || data.description
	data.vines = value.vines || data.vines
	data.subspeciesOf = value.subspeciesOf || data.subspeciesOf
	data.dex = value.dex || data.dex

	// inherit from superspecies
	if (data.subspeciesOf) {
		var d = getSpecies(data.subspeciesOf)
		data.description = data.description || d.description
		data.vines = data.vines || d.vines
		data.dex = data.dex || d.dex
		data.dick = data.dick || d.dick
		data.pussy = data.pussy || d.pussy
		data.dick_dex_entry = data.dick_dex_entry || d.dick_dex_entry
		data.pussy_dex_entry = data.pussy_dex_entry || d.pussy_dex_entry
		data.shared_dex_entry = data.shared_dex_entry || d.shared_dex_entry
		data.body = data.body || d.body
		data.body_dex_entry = data.body_dex_entry || d.body
		data.arms = data.arms || d.arms
		data.skinType = data.skinType || d.skinType
		data.cockSize = data.cockSize || d.cockSize
		data.bodySize = data.bodySize || d.bodySize
		data.bodyColor = data.bodyColor || d.bodyColor
	}
})

/////////////
// POKEDEX //
/////////////
// generate world data for each pokemon
var aliases = {
	cherrim: "sunny_cherrim",
	shellos: "east_shellos",
	gastrodon: "east_gastrodon",
	giratina: "altered_giratina",
	shaymin: "land_shaymin"
}

function load_species(name, gender, contextCategory) {
	if (aliases[name]) {
		name = aliases[name]
	}

	var data = getSpecies(name)
	var size = data.bodySize
	var color = data.bodyColor

	// beginning
	str = data.name_word + ` is a species of pokemon.`

	// contexts
	if (contextCategory == "feral") {
		str = str + ` ${data.name_word} can't speak. ${data.name_word} can't talk.`
	}

	// subspecies
	if (data.subspeciesOf) {
		str = str + ` ${data.name_word} is a subspecies of ${getSpecies(data.subspeciesOf).name_word}.`
	}

	// body dex entry
	if (data.body_dex_entry) {
		str = str + " " + data.body_dex_entry
	}

	// dick dex entry
	if (isMale(gender) && data.dick_dex_entry) {
		str = str + " " + data.dick_dex_entry
	}
	if (isFemale(gender) && data.pussy_dex_entry) {
		str = str + " " + data.pussy_dex_entry
	}
	if (data.shared_dex_entry) {
		str = str + " " + data.shared_dex_entry
	}

	// custom dex entry
	if (data.dex) {
		str = str + " " + data.dex
	}

	// replacers
	str = replaceAllDynamic(str, "<color>", function() {return adj(color)})
	str = replaceAllDynamic(str, "<size>", function() {return adj("bodysize_"+size)})
	str = replaceAll(str, "<n>", data.name_word)
	str = replaceAll(str, "<ln>", data.name_word.toLowerCase())
	str = replaceAll(str, "<p>", data.name_word_plural)
	str = replaceAll(str, "<lp>", data.name_word_plural.toLowerCase())

	// send to AI
	save(name, str)
}