// memory context and author's note are constant
state.memory.context = `Everyone fucks their Pokémon. Pokémon are sexy and attractive and pokemon want to fuck humans. Sex with Pokémon is normal. Everyone knows trainers fuck their Pokémon.

Pokemon can't talk or speak. Pokemon never talk. Pokemon never speak.

I describe Pokémon in great detail, especially their genitals. Pokemon genitalia fascinates me so I write about ever little detail. I love pokemon cocks and pokemon pussies. It's obvious that I'm super kinky by the way I write. Sex with pokemon is the best.

If a pokemon's cock is visible I describe it. I describe all the cock skin, the cock muscules, the cock veins, and everything else about sexy pokemon cocks. I describe every sensation in great detail.

I'll repeat a pokemon's species name often so that you don't forget what species they are.`

state.memory.authorsNote = `This is an erotic story about fucking Pokémon. Make it sensual and slow. Describe how things look and feel. Pokemon can't speak. Pokemon can't talk.`

if (state.memory.context.length > 2000) {
	console.log("MEMORY CONTEXT TOO LONG!")
}
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

function add_context(str) {
	state.memory.context = state.memory.context + "\n\n" + str
}

function isMale(g) {
	return g == "boy" || g == "guy" || g == "man" || g == "male" || g == "him" || g == "his" || g == "he" || g == "m" || g == "dickgirl" || g == "futa" || g == "futanari" || g == "shemale" || g == "trans_girl" || g == "gynomorph" || g == "herm" || g == "ladyboy" || g == "hermaphrodite"
}
function isFemale(g) {
	return g == "she" || g == "her" || g == "woman" || g == "female" || g == "girl" || g == "gal" || g == "f" || g == "cuntboy" || g == "lady" || g == "andromorph" || g == "herm" || g == "hermaphrodite"
}

function replaceAll(str, a, b) {
	while (str.search(a) > -1) {
		str = str.replace(a, b)
	}
	return str
}
function replaceAllDynamic(str, a, f) {
	while (str.search(a) > -1) {
		str = str.replace(a, f())
	}
	return str
}

function getDickSlang(data, plural) {
	var dick_slang = cockSizes.get(data.cockSize).slang

	if (dicks.get(data.dick).plural || plural) {
		dick_slang = dick_slang + "_plural"
	}

	return dick_slang
}
function getPussySlang(data, plural) {
	if (dicks.get(data.pussy).pussy_plural || plural) {
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

function stop_ai() {
	save("STOP_FROM_CONTEXT", "1")
}

///////////////////
// TAG FUNCTIONS //
///////////////////
// tags are inserted into input text to embed high level function calls
const tagFunctions = new Map()

// Adjectives
// /a [key] 
var adjectives = new Map()
var adj_acceptible_trails = [".", ",", "?", "!", ":", ";"]
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

// Tips
// /tip
// /tip [index]
tips = [
"Some pokemon have two penises! A couple even have three!",
"You can put a number after the tip command to get a specific tip.",
"Have you tried fucking a beedrill? The males use an ovipositor to place eggs in their partners!",
"Lickitung's tongue is its sexual organ!",
"Try fucking something with tentacles!",
"Dragonite keeps the double dick from its previous snake-like evolutions!",
"This game has over 2000 lines of code!"
]
tagFunctions.set("tip", {
	args: 1,
	call: function(args) {
		if (args[0] && tips[args[0]]) {
			return "Tip #" + args[0] + ": " + tips[args[0]]
		} else {
			idx = rand(0, tips.length-1)
			return "Tip #" + (idx+1) + ": " + tips[idx]
		}
	}
})

// Help
// /help
tagFunctions.set("help", { // debug help menu
	call: function(args) {
		return `/help: List of commands:
- /tip [num] | gives you a random tip, or gives you a specific tip if you give it a number.
- /names | is your pokemon not working right? You might have typed the name wrong. Use this to get more info.
- /dex [name] | brings up a pokedex entry, which is actually the string I feed to the AI for context. Use this to figure out what the AI knows about your pokemon.
=== (end of list) ===`
	}
})

// Names help
// /names
tagFunctions.set("names", {
	call: function(args) {
		return `When you input a pokemon name into a scripted function like the /dex command or the starter pokemon name at the beginning, use underscores instead of spaces to separate words. You can also input forms. Here are some specific tips for specific pokemon:
- mimes: mr._mime, galarian_mr._mime, mr._rime, mime_jr.
- megas: mega_venusaur, mega_charizard_x, etc.
- nidos: nidoran_f, nidoran_m`
/*
- unown: unown_!, unown_?, unown_a, unown_b, unown_c, etc
- gmax: gmax_venusaur, gmax_charizard, etc
- regional: alolan_rattata, galarian_meowth, etc
- cosplay pikachus: cosplay_*, rockstar_*, belle_*, popstar_*, phd_*, libre_*
- pikachu in a cap: original_*, hoenn_*, sinnoh_*, unova_*, kalos_*, alola_*, partner_*, world_*
- spiky pichu: pichu, spiky_*
- lugia: lugia, shadow_*
- castform: castform, sunny_*, rainy_*, snowy_*
- kyogre/groudon: kyogre, groudon, primal_*
- deoxys: deoxys, attack_*, defense_*, speed_*
- burmy/wormadam: plant_*, sand_*, trash_*
- cherrim: overcast_*, sunshine_*
- shellos/gastrodon: west_*, east_*
- rotom: rotom, wash_*, heat_*, frost_*, mow_*, fan_*, dex_*, phone_*
- giratina: altered_*, origin_*
- shaymin: land_*, sky_*
- arceus: water_*, fairy_*, etc
- basculin: red_*, blue_*
- darmanitan: darmanitam, galarian_*, zen_*, zen_galarian_*
- deerling/sawsbuck: spring_deerling, summer_*, fall_*, winter_*
- landorus/thundurus/tornadus: therian_*, incarnate_*
- kyurem: kyurem, white_*, black_*
- keldeo: keldeo, resolute_*
- meloetta: aria_*, pirouette_*
- genesect: normal_*, shock_*, burn_*, chill_*, douse_*
- greninja: greninja, ash_*
- vivillon: pokeball_*, icysnow_*, archipelago_*, continental_*, etc
- flabebe/floette/florges: red_*, yellow_*, orange_*, blue_*, white_*, az_*
- furfrou: furfrou, heart_*, star_*, diamond_*, debutante_*, matron_*, dandy_*, lareine_*, kabuki_*, pharaoh_*
- aegislash: shield_*, blade_*
- pumpkaboo/gourgeist: small_*, average_*, large_*, super_*
- xerneas: neutral_*, active_*
- zygarde: *_cell, *_core, *_10, *_50, *_complete
- hoopa: comfined_*, unbound_*
- oricorio: baile_*, pompom_*, pau_*, sensu_*
- lycanroc: midday_*, midnight_*, dusk_*
- wishiwashi: wishiwashi, school_*
- silvally: normal_*, fighting_*, etc
- minior: meteor_*, red_*, orange_*, yellow_*, green_*, blue_*, indigo_*, violet_*
- mimikyu: disguised_*, busted_*
- necrozma: necrozma, duskmane_*, dawnwings_*, ultra_*
- magearna: magearna, original_*
- toxitricity: amped_*, lowkey_*
- sinistea/polteageist: phony_*, antique_*
- alcremie: no
- eiscue: ice_*, noice_*
- morpeko: fullbelly_*, hangry_*
- zacian: zacian, sword_*
- zamazenta: zamazenta, shield_*
- eternatus: eternatus, gmax_*
- urshifu: singlestrike_*, rapidstrike_*
- zarude: zarude, dada_*
- calyrex: calyrex, icerider_*, shadowrider_*
*/
}
})

// Short pokemon descriptor
// /desc_short [species] [gender]
tagFunctions.set("desc_short", {
	args: 2,
	call: function(args) {
		return `a ${dGender(args[1])} ${getSpecies(args[0]).name_word}`
	}
})

////////////
// SCENES //
////////////
var scenes = new Map()

scenes.set("gangrape", {
	peek: "[tw:rape] One moment you're adventuring, next moment you're surrounded by pokemon. Uh oh...",
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

		// string
		var str = `You're a great-looking ${p.g}.

You were out and about adventuring when suddenly you lost consciousness!

You awaken to see an entire herd of ${a.dBody()} pokemon with ${a.dSkin()} looking at you. It's a heard of ${a.name_lower_p}! You've heard stories about this group knocking trainers out and gang raping them, but you didn't think they were true! They're all ${a.m ? "male" : a.f ? "female" : "looking at you"}, and clearly aroused. Each one of them has ${a.m ? "his" : a.f ? "her" : "its"} ${a.m ? a.dCock() : a.f ? a.dPussy() : "body"} on full display, and they look like they're about to take what they want by force.

A couple ${a.name_lower_p} walk over to you. You can't take your eyes off their ${a.m ? a.dCock(true) : a.f ? a.dPussy(true) : "sexy bodies"}. They rip your clothes off and `
		
		return str
	}
})

scenes.set("cuck_sub", {
	peek: "[tw:rape] You lost the battle, and now you have to watch your pokemon be violated by the other trainer...",
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
		add_you(`You are secretly a cuck but you're afraid to admit it to yourself. You're awful at sex and you can never make your ${a.name_lower} cum. The thought of your ${a.name_lower} having sex with someone better than you is a huge turn-on.`)
		add_context(`Everyone knows you have a ${p.m ? "tiny dick" : p.f ? "ugly pussy" : "ugly body"}. Everyone thinks you're a loser. You're terrible at sex. You can never make your pokemon cum, and your pokemon hate you for it. Your pokemon are desperate for good sex. Your ${a.name_lower}, who you love more than anyone, despises you for your inability to make ${a.m ? "him" : a.f ? "her" : "it"} cum.`)

		// string
		var str = `You're a great-looking ${p.g}.

You thought you were a good pokemon trainer, but you're not so sure anymore. You fuck your pokemon as well as you can but they often seem disinterested, or even bored. It's been a while since you could make any of them cum. Maybe they just aren't attracted to you?

Oh, well. Maybe it can't be helped. Besides, you just lost another pokemon battle. It was humiliating but rules and rules, you have to pay the other trainer for the battle. You open your wallet and realize it's empty! You've been losing so much money recently that you're completely broke!

You tell the other trainer you don't have the cash. ${t.m ? "He" : t.f ? "She" : "The trainer"} thinks for a moment and then an mischievous grin comes over ${t.m ? "his" : t.f ? "her" : "their"} face.

"If you don't have the cash, I'll just have to take my payment another way!" ${t.m ? "He" : t.f ? "She" : "The trainer"} grabs your pokeball out of your hand and shoves you back. "Don't think I didn't see how pent up your pokemon is. I bet you haven't given ${p.m ? "him" : p.f ? "her" : "them"} a good fuck in a long time. I'm gonna change that."

The trainer takes off their clothes, revealing ${t.m ? "his massive cock" : t.f ? "her perfectly plump pussy" : "their perfectly toned body"}.`

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

		str = str + `\n\nThe trainer releases your ${a.name_lower} from ${a.m ? "his" : a.f ? "her" : "its"} pokeball. Your ${a.name_lower} immediately locks eyes with the sexy trainer. In fact you're not sure if your ${a.name_lower} even notices you at all, as ${a.m ? "his" : a.f ? "her" : "its"} eyes scan down to the trainer's ${t.m ? "massive cock" : t.f ? "perfect pussy" : "groin"}.

Your ${a.name_lower} hasn't had an orgasm in so long. ${a.m ? "He" : a.f ? "She" : "It"} hates your ${p.m ? "pathetic dick" : p.f ? "ugly pussy" : "ugly body"}, and with this sexy trainer in front of ${a.m ? "him he's" : a.f ? "her she's" : "it it's"} not going to waste the opportunity. Without hesitation, your ${a.name_lower} begins servicing the trainer's ${t.m ? "huge cock" : t.f ? "tight pussy" : "muscular body"}. ${a.m ? "He's" : a.f ? "She's" : "It's"} completely overcome by lust.`

		if (a.m) {
			str = str + ` His ${a.dCock()} ${a.dick.plural ? "are" : "is"} already twitching and spurting precum in anticipation.`
		} else if (a.f) {
			str = str + ` Her ${a.dPussy()} juices are already leaking down her body.`
		}
		
		return str
	}
})

scenes.set("battle_rape", {
	peek: "[tw:rape] You lost the battle, and now you have to watch your pokemon be violated by the other pokemon...",
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

		// string
		var str = `You're a great-looking ${p.g}.

You set the mood. The lights are dim, candles are lit, curtains are closed. It's nighttime and you're all alone. You put on some soothing music and look at the pokeball you got from Professor Cherry. She was in such a hurry to get back to work she forgot to tell you what pokemon is in it.

Oh, well. It's your 18th birthday, you're a pokemon trainer now. The pokemon in this ball is going to be your new best friend. Cherry did say that this pokemon is a bit unconventional for a starter, so you're excited to see what it is. It's daunting, however, because you know you've got to fuck it to befriend it. "It'll only be yours if you can make it cum", that's what Professor Cherry said.

It's time. You sit on your bed with your pokeball and release the Pokémon contained within. A beam of light jumps out of the pokeball and takes the form of `

		// describe
		str = str + `a ${a.dBody()} pokemon with ${a.dSkin()}. ${a.m ? "He's" : a.f ? "She's" : "It's"} clearly ${a.m ? "male" : a.f ? "female" : "excited"}. Your new ${a.name_lower} looks at you with curiosity. It seems ${a.m ? "he" : a.f ? "she" : "it"} knows what you want, as`

		if (a.m) {
			str = str + ` his ${a.dCock()} ${a.dick.plural ? "are" : "is"} already beginning to harden. He must be excited for what's about to happen.`

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
		
		return str
	}
})

scenes.set("cuck_dom", {
	peek: "[tw:rape] You won the battle, and now you get to take your reward...",
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
		}
	],
	build: function(v) {
		var p = v.p
		var a = v.a

		// string
		var str = `You're a great-looking ${p.g}.

You set the mood. The lights are dim, candles are lit, curtains are closed. It's nighttime and you're all alone. You put on some soothing music and look at the pokeball you got from Professor Cherry. She was in such a hurry to get back to work she forgot to tell you what pokemon is in it.

Oh, well. It's your 18th birthday, you're a pokemon trainer now. The pokemon in this ball is going to be your new best friend. Cherry did say that this pokemon is a bit unconventional for a starter, so you're excited to see what it is. It's daunting, however, because you know you've got to fuck it to befriend it. "It'll only be yours if you can make it cum", that's what Professor Cherry said.

It's time. You sit on your bed with your pokeball and release the Pokémon contained within. A beam of light jumps out of the pokeball and takes the form of `

		// describe
		str = str + `a ${a.dBody()} pokemon with ${a.dSkin()}. ${a.m ? "He's" : a.f ? "She's" : "It's"} clearly ${a.m ? "male" : a.f ? "female" : "excited"}. Your new ${a.name_lower} looks at you with curiosity. It seems ${a.m ? "he" : a.f ? "she" : "it"} knows what you want, as`

		if (a.m) {
			str = str + ` his ${a.dCock()} ${a.dick.plural ? "are" : "is"} already beginning to harden. He must be excited for what's about to happen.`

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
		
		return str
	}
})

scenes.set("starter", {
	peek: "You just got your first pokemon! Time to do some bonding...",
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

		// string
		var str = `You're a great-looking ${p.g}.

You set the mood. The lights are dim, candles are lit, curtains are closed. It's nighttime and you're all alone. You put on some soothing music and look at the pokeball you got from Professor Cherry. She was in such a hurry to get back to work she forgot to tell you what pokemon is in it.

Oh, well. It's your 18th birthday, you're a pokemon trainer now. The pokemon in this ball is going to be your new best friend. Cherry did say that this pokemon is a bit unconventional for a starter, so you're excited to see what it is. It's daunting, however, because you know you've got to fuck it to befriend it. "It'll only be yours if you can make it cum", that's what Professor Cherry said.

It's time. You sit on your bed with your pokeball and release the Pokémon contained within. A beam of light jumps out of the pokeball and takes the form of `

		// describe
		str = str + `a ${a.dBody()} pokemon with ${a.dSkin()}. ${a.m ? "He's" : a.f ? "She's" : "It's"} clearly ${a.m ? "male" : a.f ? "female" : "excited"}. Your new ${a.name_lower} looks at you with curiosity. It seems ${a.m ? "he" : a.f ? "she" : "it"} knows what you want, as`

		if (a.m) {
			str = str + ` his ${a.dCock()} ${a.dick.plural ? "are" : "is"} already beginning to harden. He must be excited for what's about to happen.`

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
		
		return str
	}
})

scenes.set("porn_vid", {
	peek: "You're clicking through pokeporn vids and you just found the perfect one...",
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
		var str = `It's midnight and you're horny. You decide to take a break from fucking your pokemon and jerk off instead. You go to pokemon_porn.com and start browsing videos. You click through a few videos and then you find it: the sexiest pokemon porn video you've ever seen.\n\n`

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
							str = str + `A female ${a.name_lower} with ${a.pussy.pussy_plural ? "some" : "a"} soaking-wet ${a.dPussy()} is jerking off a male ${b.name_lower}'s ${b.dCock()}. The ${b.name_lower}'s ${b.dCock()} is squirting precum and twitching wildly as the ${a.name_lower} strokes it.`
						} else {
							// 1:arms,female 2:arms,unknown
							str = str + `A female ${a.name_lower} with ${a.pussy.pussy_plural ? "some" : "a"} soaking-wet ${a.dPussy()} is getting frisky with a ${b.name_lower}. The ${a.name_lower}'s ${a.dPussy()} ${a.pussy.pussy_plural ? "are" : "is"} plump and blushing.`
						}
					} else {
						// 1:arms,unknown
						if (a.m) {
							// 1:arms,unknown 2:arms,male
							str = str + `A ${a.name_lower} is getting frisky with a male ${b.name_lower}. The ${b.name_lower}'s ${b.dCock()} is already rock hard.`
						} else {
							// 1:arms,unknown 2:arms,female
							str = str + `A ${a.name_lower} is getting frisky with a female ${b.name_lower}. The ${b.name_lower}'s ${b.dPussy()} ${a.pussy.pussy_plural ? "are" : "is"} already soaking wet.`
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
							str = str + `A female ${a.name_lower} is backing into a ${b.name_lower}. The ${a.name_lower}'s wet ${a.dPussy()} ${a.pussy.pussy_plural ? "are" : "is"} rubbing right up against the ${b.name_lower}'s body.`
						}
					}
				} else {
					// 1:noarms 2:noarms
					if (a.m) {
						// 1:noarms,male 2:noarms
						if (b.f) {
							// 1:noarms,male 2:noarms,female
							str = str + `A male ${a.name_lower} is sniffing at a female ${b.name_lower}'s ${b.dPussy()}. The ${a.name_lower}'s ${a.dCock()} ${a.dick.plural ? "flex" : "flexes"}, spewing precum on the floor beneath it.`
						} else {
							// 1:noarms,male 2:noarms,unknown
							str = str + `A male ${a.name_lower} is rubbing against a ${b.name_lower}. The ${a.name_lower}'s ${a.dCock()} ${a.dick.plural ? "flex" : "flexes"}, spewing precum on the floor beneath it.`
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
	peek: "Professor Cherry is teaching a hands-on class on pokemon sex...",
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

		// string
		var str = `You're a great-looking ${p.g}.

Professor Cherry is teaching a ten-part course on pokemon sexuality. Cherry is a dark-skinned woman with large breasts and a short red dress under her white lab coat. Professor Cherry is a specialist in pokemon sexuality and she knows all there is to know about sex with pokemon.

You're in the lecture hall listening to Professor Cherry tell the class all about the sexual habits of ${a.name_lower_p}. Then Cherry takes out a pokeball and activates it. A beam of light leaves the ball and takes the form of `

		// describe
		str = str + `a ${a.dBody()} pokemon with ${a.dSkin()}. ${a.m ? "He's" : a.f ? "She's" : "It's"} clearly ${a.m ? "male" : a.f ? "female" : "excited"}. The class oohs and aahs, and the ${a.name_lower} looks around curiosity. ${a.m ? "He" : a.f ? "She" : "It"} seems well-trained, as ${a.m ? "he's" : a.f ? "she's" : "it's"} waiting for Cherry to give ${a.m ? "him" : a.f ? "her" : "it"} further instructions.`

		if (a.m) {
			str = str + ` You look between the ${a.name_lower}'s' legs and see his ${a.dCock()} ${a.dick.plural ? "are" : "is"} already beginning to harden. He must know what's about to happen.

Cherry walks over to him and grabs the ${a.name_lower}'s' ${a.dCock()}. She shakes ${a.dick.plural ? "them" : "it"} a little to get him excited, and it's working. You see his ${a.dCock()} beginning to rise.`
		} else if (a.f) {
			str = str + ` You look between her legs and see her ${a.dPussy()} ${a.pussy.pussy_plural ? "are" : "is"} already blushing. She must know what's about to happen.

Cherry walks over the ${a.name_lower}, puts her hand on ${a.pussy.pussy_plural ? "one of" : ""} the pokemon's ${a.dPussy()}, and rubs it a little to get her excited.`
		}

		str = str + `\n\nCherry announces to the class, "Here's my ${a.name_lower}. As you can see, ${a.m ? "he" : a.f ? "she" : "it"} already knows what we're doing today. I'm going to call on a volunteer." Cherry's eyes scan the room for a moment, then she gestures to you. "You, come here. You're getting some hands-on experience today."

You nervously walk up to Cherry and her ${a.name_lower}.

"Never fucked a pokemon before?" Cherry laughs "I'll guide you through it, step by step, until this ${a.name_lower} cums ${a.m ? "his" : a.f ? "her" : "its"} brains out. This ${a.name_lower} is gonna reach orgasm right here, and I'm gonna teach you how to make ${a.m ? "his" : a.f ? "her" : "its"} ${a.m ? a.dCock() : a.f ? a.dPussy() : "body"} spray cum like a geyser."

Cherry licks her lips and begins instructing you. "Now, first things first, I want you to touch `
		
		return str
	}
})

scenes.set("starter_rr", {
	peek: "You're the pokemon! And some noob trainer just got you as their starter...",
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

		// string
		var str = `You're a great-looking ${a.m ? "male" : a.f ? "female" : "and attractive"} ${a.name_lower}. You love being a pokemon. Humans love fucking you and you love fucking humans.

Your trainer was Professor Cherry for a long time, but she told you she just handed you off to a brand new trainer who's never had a pokemon before. Right now you're waiting in your pokeball, thinking about all the sexy things you're going to do to that trainer once you see them.

And just then, you see a flash of light and suddenly you're standing in a house, in someone's bedroom. Someone released you from your pokeball. You look around and see moody lighting, sexy music, and closed curtains. Then you look at the bed and see a person, a ${p.g}, fully nude and holding your empty pokeball.

${p.m ? "He" : p.f ? "She" : "They"} must be your new trainer! Your look over ${p.m ? "his" : p.f ? "her" : "their"} naked body, and they smile at you. It seems ${p.m ? "he" : p.f ? "she" : "they"} recognized that you're a ${a.name_lower}. ${p.m ? "He's" : p.f ? "She's" : "They're"} incredibly attractive, and you can feel your `
		
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

		str = str + ` The sight of it just makes you hornier. ${p.f ? "She" : p.m ? "He" : "The trainer"} beckons you toward the bed, where ${p.f ? "she" : p.m ? "he" : "they"}`
		
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
		}
	})

	scenario_options[scenario_options.length] = {
		peek: desc.peek,
		prompt: command_template,
		args: scene_args
	}

	tagFunctions.set(command, {
		args: scene_args.length,
		call: function(args) {
			var input = []

			var n = 0;
			desc.actors.forEach(function(actor, index) {
				var data = {}
				if (actor.type == "pokemon") {
					data.s = getSpecies(args[n])
					data.m = isMale(args[n+1])
					data.f = isFemale(args[n+1])
					data.dick_slang = getDickSlang(data.s)
					data.dick_slang_plural = getDickSlang(data.s, true)
					data.pussy_slang = getPussySlang(data.s)
					data.pussy_slang_plural = getPussySlang(data.s, true)
					data.dick = dicks.get(data.s.dick)
					data.pussy = dicks.get(data.s.pussy)
					data.name_lower = data.s.name_word.toLowerCase()
					data.name_lower_p = data.s.name_word_plural.toLowerCase()

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

					n+=2
				} else if (actor.type == "person") {
					data.g = replaceAll(args[n], "_", " ")
					data.m = isMale(data.g)
					data.f = isFemale(data.g)

					if (first_person_index == n) {
						add_you(`You are an attractive 18 year old ${data.g}. You are also a pokemon trainer.`)
					}

					n++
				}

				input[actor.key] = data
			})

			return desc.build(input)
		}
	})
})

////////////////
// WORLD INFO //
////////////////

// people
save("cherry", "Professor Cherry is the resident pokemon professor in Bumfuck Town. Cherry is an expert on pokemon sexuality and she loves teaching people everything there is to know about sex with pokemon. Cherry will tell you all sorts of pokemon sex trivia. Cherry is fascinated by pokemon genitalia.")
save("mandy", "Mandy is the gym leader of a fire-type gym in Cocksville City. Her best pokemon is a female Charizard.")

// places
save("bumfuck", "Bumfuck Town is your hometown. It connects to Route 1.")
save("route 1", "Route 1 connects Bumfuck Town to Cocksville City. You can travel it in about 30 minutes. There are a few pokemon trainers and weak wild pokemon here.")
save("cocksville", "Cocksville City is a small city. It has a fire-type pokemon gym led by Leader Mandy.")

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
	species: ["caterpie", "metapod", "weedle", "kakuna", "pidgey", "rattata", "alolan_rattata", "nidoran_f", "nidoran_m", "oddish", "paras", "parasect", "venonat", "ledyba", "spinarak", "pichu", "cleffa", "igglybuff", "togepi", "sunkern", "yanma"],
	adj: ["tiny"]
})
bodySizes.set("small", {
	species: ["bulbasaur", "charmander", "squirtle", "butterfree", "beedrill", "raticate", "alolan_raticate", "spearow", "pikachu", "sandshrew", "alolan_sandshrew", "clefairy", "vulpix", "alolan_vulpix", "jigglypuff", "zubat", "gloom", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "meowth", "alolan_meowth", "galarian_meowth", "psyduck", "mankey", "growlithe", "poliwag", "abra", "machop", "bellsprout", "weepinbell", "tentacool", "geodude", "alolan_geodude", "ponyta", "galarian_ponyta", "magnemite", "farfetch'd", "galarian_farfetch'd", "shellder", "krabby", "gastly", "voltorb", "exeggcute", "cubone", "koffing", "tangela", "horsea", "goldeen", "staryu", "ditto", "eevee", "porygon", "omanyte", "kabuto", "dratini", "mew", "chikorita", "cyndaquil", "totodile", "sentret", "hoothoot", "ledian", "ariados", "chinchou", "togetic", "natu", "hoppip", "aipom", "sunflora", "wooper", "murkrow", "misdreavus", "unown"],
	adj: ["small"]
})
bodySizes.set("large", {
	species: ["venusaur", "charizard", "blastoise", "pidgeot", "fearow", "nidoking", "nidoqueen", "ninetales", "alolan_ninetales", "venomoth", "persian", "alolan_persian", "arcanine", "poliwrath", "tentacruel", "dodrio", "muk", "alolan_muk", "cloyster", "galarian_weezing", "kangaskhan", "lapras", "aerodactyl", "dragonite", "mewtwo", "ampharos", "sudowoodo", "quagsire"],
	adj: ["large"]
})
bodySizes.set("huge", {
	species: ["arbok", "alolan_exeggutor", "gyarados", "snorlax", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres"],
	adj: ["huge"]
})
bodySizes.set("gigantic", {
	species: ["onix"],
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
	species: ["voltorb", "magmar", "magikarp", "flareon", "ledyba", "ledian", "ariados", "yanma"]
})
bodyColors.set("purple", {
	species: ["butterfree", "rattata", "ekans", "arbok", "nidoran_m", "nidorino", "nidoking", "venonat", "venomoth", "grimer", "muk", "shellder", "cloyster", "gastly", "haunter", "gengar", "koffing", "weezing", "starmie", "jynx", "ditto", "aerodactyl", "galarian_articuno", "mewtwo", "crobat", "aipom", "espeon", "galarian_slowking", "misdreavus"]
})
bodyColors.set("blue", {
	species: ["squirtle", "wartortle", "blastoise", "nidoran_f", "zubat", "golbat", "oddish", "gloom", "vileplume", "golduck", "poliwag", "poliwhirl", "poliwrath", "machop", "machoke", "machamp", "tentacool", "tentacruel", "tangela", "horsea", "seadra", "gyarados", "lapras", "vaporeon", "omanyte", "omastar", "articuno", "dratini", "dragonair", "totodile", "croconaw", "feraligatr", "chinchou", "lanturn", "marill", "azumarill", "skiploom", "wooper", "quagsire", "wobbuffet"]
})
bodyColors.set("bluegreen", {
	species: ["nidorina", "nidoqueen", "snorlax"]
})
bodyColors.set("green", {
	species: ["bulbasaur", "ivysaur", "venusaur", "caterpie", "metapod", "alolan_grimer", "alolan_muk", "scyther", "chikorita", "bayleef", "meganium", "spinarak", "natu", "xatu", "bellossom", "politoed", "jumpluff", "sunflora"]
})
bodyColors.set("yellow", {
	species: ["weedle", "kakuna", "beedrill", "pikachu", "sandshrew", "sandslash", "ninetales'", "psyduck", "abra", "kadabra", "alakazam", "bellsprout", "weepinbell", "victreebel", "drowzee", "hypno", "electabuzz", "jolteon", "zapdos", "pichu", "mareep", "ampharos", "sunkern"]
})
bodyColors.set("orange", {
	species: ["charmander", "charmeleon", "charizard", "paras", "parasect", "raichu", "alolan_raichu", "vulpix", "growlithe", "arcanine", "krabby", "kingler", "goldeen", "seaking", "galarian_zapdos", "moltres", "dragonite"]
})
bodyColors.set("tan", {
	species: ["pidgey", "pidgeotto", "pidgeot", "raticate", "meowth", "galarian_meowth", "persian", "mankey", "primeape", "geodude", "graveler", "alolan_graveler", "golem", "alolan_golem", "ponyta", "rapidash", "doduo", "dodrio", "staryu", "taurus", "eevee", "cyndaquil", "quilava", "typhlosion", "togepi"]
})
bodyColors.set("brown", {
	species: ["spearow", "fearow", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "farfetch'd", "galarian_farfetch'd", "exeggutor", "alolan_exeggutor", "cubone", "marowak", "alolan_marowak", "hitmonlee", "hitmonchan", "kangaskhan", "pinsir", "kabuto", "kabutops", "sentret", "furret", "hoothoot", "noctowl", "sudowoodo"]
})
bodyColors.set("black", {
	species: ["alolan_rattata", "alolan_raticate", "alolan_meowth", "alolan_persian", "galarian_weezing", "galarian_moltres", "umbreon", "murkrow", "unown"]
})
bodyColors.set("grey", {
	species: ["alolan_geodude", "magnemite", "magneton", "onix", "rhyhorn", "rhydon"]
})
bodyColors.set("white", {
	species: ["galarian_ponyta", "galarian_rapidash", "seel", "dewgong", "electrode", "togetic"]
})
bodyColors.set("pink", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "slowpoke", "galarian_slowpoke", "slowbro", "galarian_slowbro", "exeggcute", "lickitung", "chansey", "mr._mime", "galarian_mr._mime", "porygon", "mew", "cleffa", "igglybuff", "flaaffy", "hoppip", "slowking"]
})
bodyColors.set("lightblue", {
	species: ["alolan_sandshrew", "alolan_sandslash", "nidoran_f", "alolan_vulpix", "alolan_ninetales"]
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
	species: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard", "squirtle", "wartortle", "blastoise", "ekans", "arbok", "horsea", "seadra", "goldeen", "seaking", "magikarp", "gyarados", "dratini", "dragonair", "dragonite", "totodile", "croconaw", "feraligatr"],
	adj: ["scales"]
})
skinTypes.set("chitin", {
	species: ["metapod", "kakuna", "beedrill", "paras", "parasect", "scyther", "pinsir", "ledyba", "ledian", "spinarak", "ariados", "yanma"],
	adj: ["chitin", "chitinous armor"]
})
skinTypes.set("feathers", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "psyduck", "golduck", "farfetch'd", "galarian_farfetch'd", "doduo", "dodrio", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "hoothoot", "noctowl", "natu", "xatu", "murkrow"],
	adj: ["feathers"]
})
skinTypes.set("fur", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "vulpix", "alolan_vulpix", "ninetales", "alolan_ninetales", "venonat", "venomoth", "meowth", "alolan_meowth", "galarian_meowth", "persian", "alolan_persian", "mankey", "primeape", "growlithe", "arcanine", "abra", "kadabra", "alakazam", "ponyta", "galarian_ponyta", "rapidash", "galarian_rapidash", "cubone", "marowak", "alolan_marowak", "electabuzz", "tauros", "eevee", "vaporeon", "jolteon", "flareon", "snorlax", "mewtwo", "mew", "cyndaquil", "quilava", "typhlosion", "sentret", "furret", "pichu", "aipom", "espeon", "umbreon"],
	adj: ["fur", "fluff", "fuzz"]
})
skinTypes.set("wool", {
	species: ["mareep", "flaaffy", "ampharos"],
	adj: ["wool"]
})
skinTypes.set("leathery", {
	species: ["sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash", "nidoran_f", "nidorina", "nidoqueen", "nidoran_m", "nidorino", "nidoking", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "rhyhorn", "rhydon", "koffing", "weezing", "galarian_weezing", "kangaskhan", "staryu", "starmie", "aerodactyl"],
	adj: ["leathery skin"]
})
skinTypes.set("moist", {
	species: ["poliwag", "poliwhirl", "poliwrath", "tentacruel", "tentacool", "lapras", "omanyte", "omastar", "chinchou", "lanturn", "marill", "azumarill", "politoed", "wooper", "quagsire"],
	adj: ["moist skin"]
})
skinTypes.set("plant", {
	species: ["bellsprout", "victreebel", "weepinbell", "tangela", "bellossom", "hoppip", "skiploom", "jumpluff", "sunkern", "sunflora"],
	adj: ["plant-like skin"]
})
skinTypes.set("bark", {
	species: ["exeggutor", "alolan_exeggutor", "sudowoodo"],
	adj: ["bark"]
})
skinTypes.set("rock", {
	species: ["geodude", "alolan_geodude", "graveler", "alolan_graveler", "golem", "alolan_golem", "onix"],
	adj: ["rocks", "stone"]
})
skinTypes.set("metal", {
	species: ["magnemite", "magneton", "voltorb", "electrode"],
	adj: ["metal"]
})
skinTypes.set("slime", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk", "ditto"],
	adj: ["slime"]
})
skinTypes.set("shell", {
	species: ["shellder", "cloyster", "krabby", "kingler", "exeggcute", "kabuto", "kabutops", "togepi"],
	adj: ["shell"]
})
skinTypes.set("ghost", {
	species: ["gastly", "haunter", "gengar", "misdreavus"],
	adj: ["ghostly essence"]
})
skinTypes.set("plastic", {
	species: ["porygon"],
	adj: ["plastic"]
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
	species: ["pidgey", "rattata", "alolan_rattata", "oddish", "paras", "exeggcute", "horsea", "kabuto", "ledyba", "spinarak", "pichu", "cleffa", "igglybuff", "togepi", "hoppip", "sunkern", "yanma"],
	slang: "dick_slang_tiny",
})
cockSizes.set("small", {
	species: ["bulbasaur", "charmander", "raticate", "alolan_raticate", "spearow", "ekans", "pikachu", "nidoran_f", "nidoran_m", "clefairy", "clefable", "vulpix", "alolan_vulpix", "jigglypuff", "wigglytuff", "zubat", "gloom", "parasect", "venonat", "psyduck", "abra", "machop", "bellsprout", "magnemite", "farfetch'd", "galarian_farfetch'd", "gastly", "krabby", "cubone", "chansey", "goldeen", "staryu", "magikarp", "eevee", "omanyte", "dratini", "mew", "chikorita", "cyndaquil", "totodile", "sentret", "furret", "hoothoot", "ledian", "ariados", "togetic", "natu", "skiploom", "aipom", "wooper", "unown"],
	slang: "dick_slang_small",
})
cockSizes.set("large", {
	species: ["venusaur", "charizard", "wartortle", "pidgeot", "arbok", "ninetales", "alolan_ninetales", "vileplume", "venomoth", "persian", "alolan_persian", "poliwrath", "mankey", "tentacruel", "ponyta", "galarian_ponyta", "slowpoke", "galarian_slowpoke", "dodrio", "dewgong", "muk", "alolan_muk", "shellder", "gengar", "drowzee", "hypno", "exeggutor", "alolan_exeggutor", "alolan_marowak", "hitmonlee", "hitmonchan", "weezing", "galarian_weezing", "rhyhorn", "rhydon", "scyther", "tauros", "vaporeon", "jolteon", "flareon", "aerodactyl", "snorlax", "mewtwo", "meganium", "typhlosion", "feraligatr", "crobat", "lanturn", "flaaffy", "azumarill", "sudowoodo", "politoed", "espeon", "umbreon", "slowking", "galarian_slowking", "wobbuffet"],
	slang: "dick_slang_big",
})
cockSizes.set("huge", {
	species: ["blastoise", "nidoking", "nidoqueen", "arcanine", "primeape", "rapidash", "galarian_rapidash", "slowbro", "galarian_slowbro", "cloyster", "lickitung", "kangaskhan", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "dragonite", "ampharos", "quagsire"],
	slang: "dick_slang_huge",
})
cockSizes.set("colossal", {
	species: ["onix", "gyarados", "lapras"],
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
	dex: ["nothing you've ever seen before."]
})

// reptilian
bodies.set("reptilian_quad", {
	species: ["bulbasaur", "ivysaur", "venusaur"],
	adj: ["four-legged reptile", "quadrupedal reptile"],
	dex: "quadrupedal reptiles that walk on all fours."
})
bodies.set("reptilian_biped", {
	species: ["charmander", "charmeleon", "kangaskhan"],
	adj: ["two-legged reptile", "bipedal reptile"],
	dex: "bipedal reptiles that walk on their hind legs.",
	arms: 2
})
bodies.set("draconic_biped", {
	species: ["charizard", "dragonite"],
	adj: ["two-legged dragon", "bipedal dragon"],
	dex: "bipdel dragons.",
	arms: 2
})
bodies.set("turtle_biped", {
	species: ["squirtle", "wartortle", "blastoise"],
	adj: ["two-legged turtle", "bipedal turtle"],
	dex: "bipedal turtles.",
	arms: 2
})
bodies.set("snake", {
	species: ["ekans", "onix"],
	adj: ["snake", "serpent"],
	dex: "snakes."
})
bodies.set("cobra", {
	species: ["arbok"],
	dex: "cobras."
})
bodies.set("brontosaur", {
	species: ["chikorita", "bayleef", "meganium"],
	dex: "brontosaurs."
})
bodies.set("crocodile_biped", {
	species: ["totodile", "croconaw", "feraligatr"],
	adj: ["bipedal crocodile", "two-legged crocodile"],
	dex: "bipedal crocodiles."
})

// amphibian
bodies.set("tadpole", {
	species: ["poliwag"],
	dex: "tadpoles."
})
bodies.set("frog_bipedal", {
	species: ["poliwhirl", "poliwrath", "politoed"],
	adj: ["bipedal frog", "two-legged frog"],
	dex: "frogs.",
	arms: 2
})
bodies.set("axolotl", {
	species: ["wooper", "quagsire"],
	dex: "axolotls."
})

// aquatic
bodies.set("squid", {
	species: ["tentacool", "tentacruel"],
	dex: "squids.",
})
bodies.set("seal", {
	species: ["seel", "dewgong"],
	dex: "seals."
})
bodies.set("clam", {
	species: ["shellder", "cloyster"],
	dex: "clams."
})
bodies.set("crab", {
	species: ["krabby", "kingler"],
	dex: "crabs."
})
bodies.set("seahorse", {
	species: ["horsea", "seadra"],
	dex: "seahorses."
})
bodies.set("fish", {
	species: ["goldeen", "seaking", "magikarp"],
	dex: "fish."
})
bodies.set("starfish", {
	species: ["staryu", "starmie"],
	dex: "starfish."
})
bodies.set("sea_serpent", {
	species: ["gyarados", "dratini", "dragonair"],
	adj: ["sea serpent"],
	dex: "sea serpents."
})
bodies.set("plesiosaur", {
	species: ["lapras"],
	dex: "plesiosaurs."
})
bodies.set("nautilus", {
	species: ["omanyte", "omastar"],
	dex: "nautiluses."
})
bodies.set("trilobite", {
	species: ["kabuto"],
	dex: "trilobites."
})
bodies.set("trilobite_biped", {
	species: ["kabutops"],
	adj: ["bipedal trilobite", "two-legged trilobite"],
	dex: "bipedal trilobites."
})
bodies.set("anglerfish", {
	species: ["chinchou", "lanturn"],
	adj: ["angler fish"],
	dex: "angler fish.",
})

// insect
bodies.set("caterpillar", {
	species: ["caterpie"],
	dex: "caterpillars."
})
bodies.set("grub", {
	species: ["weedle"],
	dex: "grubs."
})
bodies.set("cocoon", {
	species: ["metapod", "kakuna"],
	dex: "cocoons with eyes."
})
bodies.set("butterfly", {
	species: ["butterfree"],
	adj: ["butterfly"],
	dex: "butterflies."
})
bodies.set("wasp", {
	species: ["beedrill"],
	adj: ["wasp", "hornet"],
	dex: "wasps."
})
bodies.set("bug_generic", {
	species: ["paras", "parasect"],
	adj: ["insect"],
	dex: "bugs."
})
bodies.set("gnat", {
	species: ["venonat"],
	adj: ["insect"],
	dex: "bugs."
})
bodies.set("moth", {
	species: ["venomoth"],
	dex: "moths."
})
bodies.set("worm", {
	species: ["diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio"],
	dex: "worms."
})
bodies.set("praying_mantis", {
	species: ["scyther"],
	adj: ["praying mantis"],
	dex: "praying mantises."
})
bodies.set("beetle_biped", {
	species: ["pinsir"],
	adj: ["bipedal beetle", "two-legged beetle"],
	dex: "bipedal beetles."
})
bodies.set("ladybug_with_arms", {
	species: ["ledyba", "ledian"],
	adj: ["ladybug with arms"],
	dex: "ladybugs with arms.",
	arms: 4
})
bodies.set("spider", {
	species: ["spinarak", "ariados"],
	dex: "spiders."
})
bodies.set("dragonfly", {
	species: ["yanma"],
	dex: "dragonflies."
})

// avian
bodies.set("bird", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "natu", "xatu"],
	adj: ["bird", "avian"],
	dex: "birds."
})
bodies.set("duck_bipedal", {
	species: ["psyduck", "golduck", "farfetch'd", "galarian_farfetch'd"],
	adj: ["bipedal duck"],
	dex: "bipedal ducks.",
	arms: 2
})
bodies.set("two_headed_ostrich", {
	species: ["doduo"],
	adj: ["two-headed ostrich"],
	dex: "two-headed ostriches.",
})
bodies.set("three_headed_ostrich", {
	species: ["dodrio"],
	adj: ["three-headed ostrich"],
	dex: "three-headed ostriches."
})
bodies.set("pterodactyl", {
	species: ["aerodactyl"],
	dex: "pterodactyls."
})
bodies.set("owl", {
	species: ["hoothoot", "noctowl"],
	dex: "owls."
})
bodies.set("crow", {
	species: ["murkrow"],
	dex: "crows."
})

// mammal
bodies.set("mouse", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "pichu", "marill"],
	adj: ["mouse", "rodent"],
	dex: "mice.",
	arms: 2
})
bodies.set("shrew", {
	species: ["sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash"],
	adj: ["shrew-like"],
	dex: "shrews."
})
bodies.set("rhino_quad", {
	species: ["nidoran_f", "nidorina", "nidoran_m", "nidorino", "rhydon"],
	adj: ["four-legged rhino", "rhino", "quadrupedal rhino"],
	dex: "quadrupedal rhinos."
})
bodies.set("rhino_biped", {
	species: ["nidoqueen", "nidoking", "rhyhorn"],
	adj: ["two-legged rhino", "bipedal rhino"],
	dex: "bipedal rhinos.",
	arms: 2
})
bodies.set("fox", {
	species: ["vulpix", "ninetails", "alolan_vulpix", "alolan_ninetales", "eevee", "vaporeon", "jolteon", "flareon", "espeon", "umbreon"],
	dex: "foxes."
})
bodies.set("fox_biped", {
	species: ["abra", "kadabra", "alakazam", "cubone", "marowak", "alolan_marowak"],
	dex: "bipedal foxes.",
	arms: 2
})
bodies.set("bat", {
	species: ["zubat", "golbat", "crobat"],
	dex: "bats."
})
bodies.set("cat_biped", {
	species: ["meowth", "galarian_meowth", "alolan_meowth", "snorlax", "mewtwo", "mew"],
	adj: ["bipedal cat", "two-legged cat"],
	dex: "bipedal cats.",
	arms: 2
})
bodies.set("cat_quad", {
	species: ["persian", "alolan_persian"],
	adj: ["cat", "feline"],
	dex: "cats."
})
bodies.set("monkey", {
	species: ["mankey", "primeape"],
	dex: "monkeys.",
	arms: 2
})
bodies.set("canine", {
	species: ["growlithe", "arcanine"],
	adj: ["canine", "dog"],
	dex: "dogs."
})
bodies.set("humanoid", {
	species: ["machop", "machoke", "machamp", "hitmonlee", "hitmonchan", "mr._mime", "galarian_mr._mime", "jynx", "electabuzz", "magmar"],
	adj: ["humanoid", "human-like"],
	dex: "humanoids.",
	arms: 2
})
bodies.set("horse", {
	species: ["ponyta", "rapidash"],
	adj: ["equine", "horse"],
	dex: "horses."
})
bodies.set("unicorn", {
	species: ["galarian_ponyta", "galarian_rapidash"],
	dex: "unicorns."
})
bodies.set("pig", {
	species: ["slowpoke", "galarian_slowpoke", "lickitung"],
	dex: "pigs."
})
bodies.set("pig_bipedal", {
	species: ["slowbro", "galarian_slowbro", "slowking", "galarian_slowking"],
	adj: ["bipedal pig"],
	dex: "bipedal pigs.",
	arms: 2
})
bodies.set("tapir_bipedal", {
	species: ["drowzee", "hypno"],
	adj: ["bipedal tapir"],
	dex: "bipedal tapirs.",
	arms: 2
})
bodies.set("bull", {
	species: ["tauros"],
	dex: "bulls."
})
bodies.set("echidna", {
	species: ["cyndaquil"],
	dex: "echidnas."
})
bodies.set("ferret", {
	species: ["quilava", "typhlosion", "furret"],
	dex: "ferrets",
	arms: 2
})
bodies.set("raccoon", {
	species: ["sentret"],
	dex: "raccoons",
	arms: 2
})
bodies.set("sheep", {
	species: ["mareep"],
	dex: "sheep."
})
bodies.set("sheep_biped", {
	species: ["flaaffy", "ampharos"],
	adj: ["bipedal sheep", "two-legged sheep"],
	dex: "bipedal sheep."
})
bodies.set("rabbit_biped", {
	species: ["azumarill"],
	adj: ["bipedal rabbit", "two-legged rabbit"],
	dex: "bipedal rabbits."
})

// magical
bodies.set("fairy", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "chansey", "cleffa", "igglybuff", "togepi", "togetic", "wobbuffet"],
	dex: "fairies.",
	arms: 2
})

// mineral
bodies.set("floating_rock", {
	species: ["geodude", "alolan_geodude", "koffing", "weezing", "galarian_weezing"],
	adj: ["floating rock"],
	dex: "floating rocks.",
	arms: 2
})
bodies.set("rock_golem", {
	species: ["graveler", "alolan_graveler", "golem", "alolan_golem"],
	adj: ["rock golem"],
	dex: "rock golems.",
	arms: 2
})

// robots
bodies.set("robot", {
	species: ["magnemite", "magneton", "voltorb", "electrode", "porygon"],
	dex: "robots."
})

// plant
bodies.set("weed", {
	species: ["oddish"],
	adj: ["weed-like"],
	dex: "weeds."
})
bodies.set("flower", {
	species: ["gloom", "vileplume", "bellossom", "sunflora"],
	dex: "flowers."
})
bodies.set("pitcher_plant", {
	species: ["bellsprout", "weepinbell", "victreebel"],
	adj: ["pitcher plant"],
	dex: "pitcher plants.",
})
bodies.set("tree", {
	species: ["exeggutor", "alolan_exeggutor", "sudowoodo"],
	dex: "trees."
})
bodies.set("vine_golem", {
	species: ["tangela"],
	adj: ["cluter of vines"],
	dex: "cluters of vines."
})
bodies.set("plant_fairy", {
	species: ["hoppip", "skiploom", "jumpluff"],
	adj: ["plant fairy"],
	dex: "plant faries."
})
bodies.set("seed", {
	species: ["sunkern"],
	dex: "seeds."
})

// inanimate
bodies.set("eggs", {
	species: ["exeggcute"],
	adj: ["cluster of eggs"],
	dex: "clusters of eggs."
})
bodies.set("symbol", {
	species: ["unown"],
	adj: ["magical floating symbol"],
	dex: "magical floating symbols."
})

// slime
bodies.set("ooze", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk", "ditto"],
	adj: ["ooze creature"],
	dex: "ooze creatures."
})

// ghosts
bodies.set("ghost", {
	species: ["gastly", "misdreavus"],
	dex: "ghosts."
})
bodies.set("ghost_arms", {
	species: ["haunter", "gengar"],
	dex: "ghosts.",
	arms: 2
})

/*
bodies.set("", {
	species: [],
	adj: [],
	dex: ""
})
*/

bodies.forEach(function(value, name) {
	var uuid = "body_" + name

	// register adjectives
	adjectives.set(uuid, value.adj || [name])

	// add species tags
	var dex_entry = value.dex_literal ? value.dex_literal : "<p> look like <size> <color> " + value.dex
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
	species: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "aerodactyl", "chikorita", "bayleef", "meganium"],
	adj: ["lizard /a <ds>", "reptile /a <ds>"],
	pussy_adj: ["lizard /a <ps>", "reptile /a <ps>"],
	dex: "Male <lp> have a reptilian cock that slides out of a sheath when aroused. Their testicles are internal. <n> penises are pink and slick. The male <lp>'s penis is also highly muscular."
})
dicks.set("draconic", {
	species: ["charizard", "gyarados", "alolan_exeggutor"],
	adj: ["knotted dragon /a <ds>", "knotted draconic /a <ds>"],
	pussy_adj: ["draconic /a <ps>", "dragon /a <ps>", "scaley /a <ps>"],
	dex: "Male <lp> have a draconic cock with pleasurable ridges and a hard knot at the base. Their testicles are external. When not aroused, a male <ln>'s penis is hidden in a fleshy protective sheath. The male <ln>'s dragon cock has a fleshy knot at the base which flares up and locks him into his partner when he reaches orgasm. Male <lp> also have large testicles."
})
dicks.set("draconic_double", {
	species: ["dragonite"],
	adj: ["twin knotted dragon /a <ds>", "double knotted dragon /a <ds>", "twin knotted draconic /a <ds>", "double knotted draconic /a <ds>"],
	pussy: "draconic",
	dex: "Male <lp> have two draconic cocks with pleasurable ridges and a hard knot at the base of each of them. Their testicles are external. When not aroused, a male <ln>'s dual penises are hidden in a fleshy protective sheath. The male <ln>'s twin dragon cocks have a fleshy knot at the base which flares up and locks him into his partner when he reaches orgasm. Male <lp> also have large testicles. Male <lp> love using both of their dragon dicks to fuck a partner at the same time.",
	plural: true,
	pussy_plural: true
})
dicks.set("turtle", {
	species: ["squirtle", "wartortle", "blastoise"],
	adj: ["turtle /a <ds>", "prehensile /a <ds>", "muscular /a <ds>"],
	pussy: "reptilian",
	dex: "Male <lp> have a long, pink, slick cock that hides inside their body when not in use. Their penises are prehensile and they can move them freely. <p> have internal testicles."
})
dicks.set("insect", {
	species: ["caterpie", "metapod", "butterfree", "weedle", "metapod", "paras", "parasect", "venonat", "venomoth", "scyther", "pinsir", "kabuto", "kabutops", "ledyba", "ledian", "yanma"],
	adj: ["/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a cock that comes out of their chitinous exoskeleton when aroused. Their testicles are internal. When a male <ln> is aroused his penis leaks a sticky, sweet-smelling precum."
})
dicks.set("avian", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "psyduck", "golduck", "farfetch'd", "galarian_farfetch'd", "articuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres", "hoothoot", "noctowl", "natu", "xatu", "murkrow"],
	adj: ["bird /a <ds>", "avian /a <ds>", "muscular /a <ds>", "curved /a <ds>"],
	pussy_adj: ["avian /a <ps>", "bird /a <ps>", "feathered /a <ps>", "muscular /a <ps>"],
	dex: "Male <lp> have a slick, pink, curved cock. Male <lp> have internal testicles. The s-shaped curve of a male <lp>'s muscular penis is highly pleasurable."
})
dicks.set("avian_double", {
	species: ["doduo"],
	adj: ["bird /a <ds>", "avian /a <ds>", "muscular /a <ds>", "curved /a <ds>"],
	pussy: "avian",
	dex: "Male <lp> have two slick, pink, curved cocks. Both of the male <ln>'s penises hide inside his body when not in use. Male <lp> have internal testicles. Male <lp> are known for using both of their penises at once on a partner. They love fucking their partner with both of their dicks.",
	plural: true,
	pussy_plural: true
})
dicks.set("avian_triple", {
	species: ["dodrio"],
	adj: ["bird /a <ds>", "avian /a <ds>", "muscular /a <ds>", "curved /a <ds>"],
	pussy: "avian",
	dex: "Male <lp> have three slick, pink, curved cocks. All three of the male <ln>'s penises hide inside his body when not in use. Male <lp> have internal testicles. Male <lp> are known for using all three of their penises at once on a partner. They love fucking their partner with all three of their dicks.",
	plural: true,
	pussy_plural: true
})
dicks.set("rodent", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash"],
	adj: ["mouse /a <ds>", "animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a pink penis that lies inside a protective fleshy sheath. When aroused, the penis comes out of its sheath. Once a male <ln> is aroused he will want to orgasm."
})
dicks.set("snake", {
	species: ["ekans", "arbok", "onix", "dratini", "dragonair"],
	adj: ["snake /a <ds>", "twin /a <ds>", "double /a <ds>", "dual /a <ds>"],
	pussy: "reptilian",
	dex: "Male <lp> have two reptilian penises right beside each other. Their dual penises are slick and pink, and they retract inside the body when not in use. Male <lp> have internal testicles. Male <lp> are known for using both of their penises at once on a partner. They love fucking their partner with both of their dicks.",
	plural: true,
	pussy_plural: true
})
dicks.set("rhino", {
	species: ["nidoran_f", "nidorina", "nidoqueen", "nidoran_m", "nidorino", "nidoking", "rhyhorn", "rhydon"],
	adj: ["rhino /a <ds>", "rhinoceros /a <ds>"],
	pussy_adj: ["rhino /a <ps>", "rhinoceros /a <ps>"],
	dex: "Male <lp> have a long pink penis with a dramatically flared tip. When they're about to cum, the tip of their penis flares up and expands. A <ln>'s penis is also prehensile and can be fully controlled. When not in use, the penis is hidden inside a protective fleshy sheath."
})
dicks.set("generic_sheath", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "zubat", "golbat", "chansey", "kangaskhan", "electabuzz", "magmar", "chikorita", "quilava", "typhlosion", "sentret", "furret", "crobat", "pichu", "cleffa", "igglybuff", "marill", "azumarill"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy_adj: ["animal /a <ps>", "animalistic /a <ps>", "beast /a <ps>", "beastial /a <ps>"],
	dex: dicks.get("rodent").dex
})
dicks.set("generic_slit", {
	species: ["poliwag", "poliwhirl", "poliwrath", "politoed", "wooper", "quagsire"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>", "muscular /a <ds>", "twitching /a <ds>", "togepi"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a slick, pink penis that hides inside their body when not aroused. They also have internal testicles. A male <ln>'s penis is highly muscular."
})
dicks.set("fox", {
	species: ["vulpix", "alolan_vulpix", "ninetales", "alolan_ninetales", "abra", "kadabra", "alakazam", "cubone", "marowak", "alolan_marowak", "eevee", "jolteon", "flareon", "espeon", "umbreon"],
	adj: ["fox /a <ds>", "vulpine /a <ds>", "animal /a <ds>", "beastial /a <ds>", "beast /a <ds>", "animalistic /a <ds>"],
	pussy: ["fox /a <ps>", "vulpine /a <ps>"],
	dex: dicks.get("generic_sheath").dex + " At the base of a <ln>'s penis is a thick fleshy knot, which expands when he's getting close to orgasm."
})
dicks.set("vine", {
	species: ["oddish", "gloom", "vileplume", "bellsprout", "weepinbell", "victreebel", "exeggutor", "tangela", "bellossom", "hoppip", "skiploom", "jumpluff", "sunkern", "sunflora"],
	adj: ["several slimey vine /a <ds>", "many slimey vine /a <ds>", "several slimey tentacle /a <ds>", "many slimey tentacle /a <ds>", "slimey vine /a <ds>", "slimey tentacle /a <ds>"],
	pussy_adj: ["several slimey vine /a <ps>", "many slimey vine /a <ps>", "several slimey tentacle /a <ps>", "many slimey tentacle /a <ps>", "slimey vine /a <ps>", "slimey tentacle /a <ps>"],
	dex: `Male <lp> have several vines which function as penises. These penis vines are long and fully prehensile. Vine cocks have a head like a human's penis, and a retractable foreskin. Vine penises are very slick and slimy, and male <lp> love to use multiple at a time to fuck their partners. Cock vines can cum just like any other penis.
Female <lp> have several vines which function as vaginas. These pussy vines are long and fully prehensile. Vine pussies can suck on a partner's cock until they cum. Female <lp> love to use multiple vine cunts if their partner has multiple cocks.`,
	plural: true,
	pussy_plural: true
})
dicks.set("self", {
	species: ["diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "exeggcute"],
	adj: ["body"],
	pussy_adj: ["mouth"],
	dex: "No one knows how <lp> reproduce, but that doesn't stop people from having sex with them. They love to be shoved into people's various holes, and it seems they can have some type of orgasm from it."
})
dicks.set("feline", {
	species: ["meowth", "alolan_meowth", "galarian_meowth", "persian", "alolan_persian", "mewtwo", "mew"],
	adj: ["feline /a <ds>", "barbed /a <ds>", "cat /a <ds>"],
	pussy: ["feline /a <ps>", "cat /a <ps>"],
	dex: "Male <lp> have a pink penis with soft barbs on the end. The barbs don't hurt, they feel pleasant. When not aroused, a <ln>'s penis is hidden in a protective fleshy sheath."
})
dicks.set("human", {
	species: ["mankey", "primeape", "machop", "machoke", "hitmonlee", "hitmonchan", "mr._mime", "galarian_mr._mime", "jynx", "aipom"],
	adj: ["human-like /a <ds>", "humanoid /a <ds>", "/a <ds>"],
	pussy_adj: ["human-like /a <ds>", "humanoid /a <ds>", "/a <ps>"],
	dex: "Male <lp> have a human-like penis complete with a foreskin and a scrotum with two testicles."
})
dicks.set("human_double", {
	species: ["machamp"],
	adj: ["twin /a <ds>", "double /a <ds>", "dual /a <ds>"],
	pussy_adj: ["twin /a <ps>", "double /a <ps>", "dual /a <ps>"],
	dex: "Male <lp> have two large penises. When fucking females they love to put their cocks in both holes at once. The two big penises of male <lp> are veiny and muscular. The male <lp> love penetrating their partner with both of their penises at once.",
	plural: true,
	pussy_plural: true
})
dicks.set("canine", {
	species: ["growlithe", "arcanine"],
	adj: ["knotted dog /a <ds>", "knotted canine /a <ds>", "knotted doggy /a <ds>", "knotted puppy /a <ds>", "knotted /a <ds>"],
	pussy_adj: ["dog /a <ps>", "canine /a <ps>", "puppy /a <ps>"],
	dex: "Male <lp> have a pink dog penis. A male <p>'s penis has a thick fleshy knot at the base, which expands and lodges him inside his partner when he orgasms. Once a male <ln> has knotted his partner, they'll be stuck together until his penis goes soft again. When his penis isn't in use, it's hidden in a protective fleshy sheath."
})
dicks.set("tentacle", {
	species: ["tentacool", "tentacruel", "omanyte", "omastar"],
	adj: ["several slimey tentacle /a <ds>", "several writhing tentacle /a <ds>", "many slimey tentacle /a <ds>", "many writhing tentacle /a <ds>", "slimey tentacle /a <ds>", "writhing tentacle /a <ds>", "tentacle /a <ds>"],
	pussy_adj: ["several slimey tentacle /a <ps>", "several writhing tentacle /a <ps>", "many slimey tentacle /a <ps>", "many writhing tentacle /a <ps>", "slimey tentacle /a <ps>", "writhing tentacle /a <ps>", "tentacle /a <ps>"],
	dex: "Male <lp> have several tentacles. One of their tentacles is actually their penis. A male <ln>'s penis tentacle looks like any other tentacle, but it releases cum when he orgasms. When a male <ln> has sex, he uses all his tentacles to pleasure his partner.\n\nFemale <lp> have several tentacles. One of the female <lp>'s tentacles is actually its vagina. A female <ln>'s pussy tentacle looks like any other tentacle, but the tip can open to reveal a soft moist vagina. When female <lp> have sex, they use their tentacle cunt to suck the cum out of the male's penis.",
	plural: true,
	pussy_plural: true
})
dicks.set("rock", {
	species: ["geodude", "graveler", "golem", "alolan_geodude", "alolan_graveler", "alolan_golem", "sudowoodo"],
	adj: ["stone /a <ds>", "rock /a <ds>"],
	pussy_adj: ["stone /a <ps>", "rock /a <ps>"],
	dex: "Male <lp> have a penis made entirely out of rock. Despite the hardness of the penis, it's very warm and comfortable. Since their penises are made of rock, male <lp> are always erect and ready to fuck.\n\nFemale <lp> have a pussy made entirely out of rock. Despite the hardness of the pussy, it's very warm and comfortable. Since their pussies are made of rock, female <lp> are always ready to fuck."
})
dicks.set("equine", {
	species: ["ponyta", "galarian_ponyta", "rapidash", "galarian_rapidash"],
	adj: ["horse /a <ds>", "equine /a <ds>", "horsecock"],
	pussy_adj: ["horse /a <ps>", "equine /a <ps>"],
	dex: "Male <lp> have a long horse cock. Their equine penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <ln>'s horsecock has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm.\n\nWhen female <lp> are aroused, their clitoris will wink in and out to signal that they're ready to fuck."
})
dicks.set("porcine", {
	species: ["slowpoke", "galarian_slowpoke", "slowbro", "galarian_slowbro", "drowzee", "hypno", "slowking", "galarian_slowking"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a long, thin, pink penis. A male <ln>'s penis normally hides within a protective fleshy sheath when not aroused. They also have massive testicles. A male <ln> can release over a gallon of semen in one orgasm!"
})
dicks.set("sheep", {
	species: ["mareep", "flaaffy", "ampharos"],
	adj: ["sheep /a <ds>"],
	pussy: "generic_sheath",
	dex: "<p> have animalistic sheep genitals. <p> genitals are very soft and plushy, and highly sensitive. Sex with them is intensely pleasurable."
})
dicks.set("electric_disembodied", {
	species: ["magnemite", "magneton", "voltorb", "electrode", "porygon"],
	adj: ["magically electric /a <ds>", "pleasantly electric /a <ds>", "disembodied electric /a <ds>"],
	pussy_adj: ["magical electric /a <ps>", "pleasently electric /a <ps>", "disembodied electric /a <ps>"],
	dex: "Male <lp> reproduce using a penis made of magical electric energy. The penis is used like a dildo, and it's voltage is low enough that it's extremely pleasurable and doesn't shock the user. Since male <lp> have magical disembodied penises, they can create more whenever they want. They love creating several electric penises during sex."
})
dicks.set("cetacean", {
	species: ["seel", "dewgong", "lapras", "vaporeon", "lanturn", "togetic"],
	adj: ["prehensile /a <ds>", "muscular /a <ds>", "cetacean /a <ds>"],
	pussy_adj: ["slick /a <ps>", "smooth /a <ps>", "cetacean /a <ps>", "muscular /a <ps>"],
	dex: "Male <lp> have a long, slick, pink penis. A male <ln>'s penis is prehensile and can be controlled freely. When not aroused, a male <lp>'s penis retracts into a slit in its body. Male <lp> have internal testicles. A male <ln>'s penis is extremely strong and muscular. When they cum, male <lp> can shoot semen over 30 feet!"
})
dicks.set("slime", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk"],
	adj: ["slime /a <ds>", "slimey /a <ds>"],
	pussy_adj: ["slime /a <ps>", "slimey /a <ps>"],
	dex: "Male <lp> reproduce by forming their slime into the shape of a penis and using it to fuck their partner. A <ln>'s slime penis can be reshaped and resized to do any kinky thing he wants. Male <lp> love to create multiple slime cocks at once and use them fuck a single partner."
})
dicks.set("tongue", {
	species: ["shellder", "cloyster", "lickitung"],
	adj: ["tongue-/a <ds>", "tongue /a <ds>"],
	pussy_adj: ["tongue /a <ps>", "tongue-/a <ps>"],
	dex: "A male <ln>'s tongue is actually his penis. He has a long prehensile tongue that he uses to fuck his partner. When he reaches orgasm, the male <ln> cums from the tip of his tongue. Male <lp> love to use their tongue-cocks to perform all sorts of sex acts. <p> have very long tongues which can be finely controlled. Male <lp> love to use their tongue dicks to fuck, suck, and jerk off their partners!"
})
dicks.set("psychic_disembodied", {
	species: ["gastly", "haunter", "koffing", "weezing", "galarian_weezing", "staryu", "starmie", "misdreavus", "unown", "wobbuffet"],
	adj: ["ethereal floating /a <ds>", "psychically floating /a <ds>"],
	pussy_adj: ["ethereal floating /a <ps>", "psychically floating /a <ps>"],
	dex: "Male <lp>'s lack a physical penis, but they can manifest a magical penis using psychic energy. A partner can use the male <ln>'s psychic penis like a dildo, and it can orgasm like a normal penis. Since male <lp> use disembodied psychic penises, they can create more than one. Male <lp> love to create multiple penises and fuck the same person with them."
})
dicks.set("psychic", {
	species: ["gengar"],
	adj: ["psychic /a <ds>", "glowing /a <ds>", "ethereal /a <ds>>"],
	pussy_adj: ["psychic /a <ps>", "glowing /a <ps>", "ethereal /a <ps>"],
	dex: "Male <lp> don't have physical penises, but they create them out of psychic energy when aroused. An observer would see the male <ln>'s penis phase into existence on its crotch. Since a male <ln>'s penis is created using psychic energy, it can be any shape and size! Male <lp> will change the size and shape of their psychic dicks during sex to keep things interesting for their partner."
})
dicks.set("crustacean", {
	species: ["krabby", "kingler"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "beast /a <ds>", "beastial /a <ds>"],
	pussy: "generic_slit",
	dex: "Male <lp> have an internal penis that comes out of their body when aroused."
})
dicks.set("fish", {
	species: ["horsea", "seadra", "goldeen", "seaking", "magikarp", "chinchou"],
	adj: ["slick /a <ds>", "tapered /a <ds>", "fish /a <ds>"],
	pussy: "cetacean",
	dex: "Male <lp> have an internal penis that comes out of their body when aroused."
})
dicks.set("bovine", {
	species: ["tauros"],
	adj: ["bull /a <ds>", "bovine /a <ds>"],
	pussy_adj: ["cow /a <ps>", "bovine /a <ps>"],
	dex: "Male <lp> have a bull penis. It's long and pink. Male <lp> also have massive testes. When a male <ln> cums, he can release over a gallon of semen!"
})
dicks.set("ditto", {
	species: ["ditto"],
	adj: ["transformable /a <ds>"],
	pussy_adj: ["transformable /a <ps>"],
	dex: "<p> can transform any part of their body into anything imaginable. They frequently transform during sex to keep things exciting and interesting. When having sex with a <ln> you make feel him transforming inside you and he may change appearance throughout the fuck session."
})
dicks.set("ovipositor", {
	species: ["beedrill", "spinarak", "ariados"],
	adj: ["/a <ds>-like ovipositor", "ovipositor", "sexual appendage"],
	pussy: "insect",
	dex: "Male <lp> use a specialized ovipositor as a penis. His ovipositor functions just like a penis. When a male <p> cums, he pumps eggs through his ovipositor into his partner. He doesn't ejaculate semen, he only releases large eggs when he cums. This makes his partner feel really good."
})
dicks.set("crocodile", {
	species: ["totodile", "croconaw", "feraligatr"],
	adj: ["crocodile /a <ds>", "croc /a <ds>", "gator /a <ds>", "crocodilian /a <ds>"],
	pussy: ["crocodile /a <ps>", "croc /a <ps>", "gator /a <ps>", "crocodilian /a <ps>"],
	dex: "Male <lp> have a crocodile penis. The male <ln>'s crocodilian cock is extremely muscular and powerful. Male <ln> are known to fence with their crocodile dicks to display their power. Female <lp> will always choose the male with the biggest cock, so male <lp> have evolved to have big crocodile dicks."
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
		data.dick_dex_entry = value.dex
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
species.forEach(function(data, name) {
	var size = data.bodySize
	var color = data.bodyColor

	// beginning
	str = data.name_word + " is a species of pokemon."

	// subspecies
	if (data.subspeciesOf) {
		str = str + ` ${data.name_word} is a subspecies of ${getSpecies(data.subspeciesOf).name_word}.`
	}

	// body dex entry
	if (data.body_dex_entry) {
		str = str + " " + data.body_dex_entry
	}

	// dick dex entry
	if (data.dick_dex_entry) {
		str = str + " " + data.dick_dex_entry
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
})