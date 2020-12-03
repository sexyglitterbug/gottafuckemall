// memory context and author's note are constant
state.memory.context = `In this world, everyone fucks their Pokémon. Pokémon are super sexy and attractive and they want to fuck humans.

Pokemon can't talk or speak, but they communicate through body language. Always describe what Pokemon are doing and how they're doing it.

When a Pokémon's cock is visible, describe its cock. When you're touching a Pokémon, describe how it feels. When you see a Pokémon, describe how it looks.

Describe Pokémon in great detail, especially their genitals.

When you're traveling you may run into other trainers. When a Pokémon trainer sees you they will challenge you to a battle. To win a battle you have to make the other person's Pokémon cum before they make your Pokémon cum.

You may find wild Pokémon. Wild Pokémon will try to fuck you. If you make them cum they will let you capture them.

Sex with Pokémon is normal. Everyone knows trainers fuck their Pokémon.

When two Pokémon trainers battle they don't fight.

A Pokémon battle is when each trainer tries to make the other trainer's Pokémon cum.`

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

function save(key, value) {
	addWorldEntry(key, value, false)
}

function load(key) {
	for (i=0; i<worldEntries.length; i++) {
		if (worldEntries[i].keys == key) {
			return worldEntries[i].entry
		}
	}
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

///////////////////
// TAG FUNCTIONS //
///////////////////
// tags are inserted into input text to embed high level function calls
const tagFunctions = new Map()

// Adjectives
// /a [key] 
adjectives = new Map()
function adj(word) {
	list = adjectives.get(word)
	if (list) {
		return list[rand(0, list.length-1)]
	}
	return ("NO ADJECTIVE FOUND FOR INPUT: (" + word + ")")
}
tagFunctions.set("a", {
	args: 1,
	call: function(args) {
		return adj(args[0])
	}
})

// Define Sex Organs
// /definesexorgans [word]
tagFunctions.set("definesexorgans", {
	args: 1,
	call: function(args) {
		save("user_def_gender", args[0])
		save("You", "You are an attractive 18 year old " + args[0] + ". You are also a pokemon trainer and it is your goal to collect all eight gym badges and become the pokemon champion.")
		return args[0]
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
"Have you tried fucking an Arbok or a Machamp? They both have two penises!",
"You can put a number after the tip command to get a specific tip.",
"Have you tried fucking a beedrill? The males use an ovipositor to place eggs in their partners!",
"Lickitung's tongue is its sexual organ! Try fucking it!",
"Try fucking something with tentacles!"
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
adjectives.set("dick_huge", ["monster", "massive", "gigantic", "thick", "colossal", "way above average", "girthy", "fat", "extra long", "extra thick", "veiny"])
// dick slang
adjectives.set("dick_slang_small", ["pecker", "dick", "cock"])
adjectives.set("dick_slang_small_plural", ["peckers", "dicks", "cocks"])
adjectives.set("dick_slang_med", ["cock", "dick", "penis"])
adjectives.set("dick_slang_med_plural", ["cocks", "dicks", "penises"])
adjectives.set("dick_slang_big", ["rod", "cock", "dick", "penis"])
adjectives.set("dick_slang_big_plural", ["rods", "cocks", "dicks", "penises"])
// pussy slang
adjectives.set("pussy_slang", ["pussy", "cunt"])

/////////////
// SPECIES //
/////////////
var species = new Map()

function getSpecies(name) {
	if (species.get(name)) {
		return species.get(name)
	} else {
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
	species: ["caterpie", "metapod", "weedle", "kakuna", "pidgey", "rattata", "alolan_rattata", "nidoran_f", "nidoran_m", "oddish", "paras", "parasect", "venonat"],
	adj: ["tiny"]
})
bodySizes.set("small", {
	species: ["bulbasaur", "charmander", "squirtle", "butterfree", "beedrill", "raticate", "alolan_raticate", "spearow", "pikachu", "sandshrew", "alolan_sandshrew", "clefairy", "vulpix", "alolan_vulpix", "jigglypuff", "zubat", "gloom", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "meowth", "alolan_meowth", "galarian_meowth", "psyduck", "mankey", "growlithe", "poliwag", "abra", "machop", "bellsprout", "weepinbell", "tentacool", "geodude", "alolan_geodude", "ponyta", "galarian_ponyta", "magnemite", "farfetch'd", "galarian_farfetch'd"],
	adj: ["small"]
})
bodySizes.set("large", {
	species: ["venusaur", "charizard", "blastoise", "pidgeot", "fearow", "nidoking", "nidoqueen", "ninetales", "alolan_ninetales", "venomoth", "persian", "alolan_persian", "arcanine", "poliwrath", "tentacruel", "dodrio"],
	adj: ["large"]
})
bodySizes.set("huge", {
	species: ["arbok"],
	adj: ["huge"]
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
bodyColors.set("purple", {
	species: ["butterfree", "rattata", "ekans", "arbok", "nidoran_m", "nidorino", "nidoking", "venonat", "venomoth"]
})
bodyColors.set("blue", {
	species: ["squirtle", "wartortle", "blastoise", "nidoran_f", "zubat", "golbat", "oddish", "gloom", "vileplume", "golduck", "poliwag", "poliwhirl", "poliwrath", "machop", "machoke", "machamp", "tentacool", "tentacruel"]
})
bodyColors.set("bluegreen", {
	species: ["nidorina", "nidoqueen"]
})
bodyColors.set("green", {
	species: ["bulbasaur", "ivysaur", "venusaur", "caterpie", "metapod"]
})
bodyColors.set("yellow", {
	species: ["weedle", "kakuna", "beedrill", "pikachu", "sandshrew", "sandslash", "ninetales'", "psyduck", "abra", "kadabra", "alakazam", "bellsprout", "weepinbell", "victreebel"]
})
bodyColors.set("orange", {
	species: ["charmander", "charmeleon", "charizard", "paras", "parasect", "raichu", "alolan_raichu", "vulpix", "growlithe", "arcanine"]
})
bodyColors.set("tan", {
	species: ["pidgey", "pidgeotto", "pidgeot", "raticate", "meowth", "galarian_meowth", "persian", "mankey", "primeape", "geodude", "graveler", "alolan_graveler", "golem", "alolan_golem", "ponyta", "rapidash"]
})
bodyColors.set("brown", {
	species: ["spearow", "fearow", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio"]
})
bodyColors.set("black", {
	species: ["alolan_rattata", "alolan_raticate", "alolan_meowth", "alolan_persian"]
})
bodyColors.set("grey", {
	species: ["alolan_geodude"]
})
bodyColors.set("white", {
	species: ["galarian_ponyta", "galarian_rapidash"]
})
bodyColors.set("pink", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff"]
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
	species: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard", "squirtle", "wartortle", "blastoise", "ekans", "arbok"],
	adj: ["scales"]
})
skinTypes.set("chitin", {
	species: ["metapod", "kakuna", "beedrill", "paras", "parasect"],
	adj: ["chitin", "chitinous armor"]
})
skinTypes.set("feathers", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "psyduck", "golduck"],
	adj: ["feathers"]
})
skinTypes.set("fur", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "vulpix", "alolan_vulpix", "ninetales", "alolan_ninetales", "venonat", "venomoth", "meowth", "alolan_meowth", "galarian_meowth", "persian", "alolan_persian", "mankey", "primeape", "growlithe", "arcanine", "abra", "kadabra", "alakazam", "ponyta", "galarian_ponyta", "rapidash", "galarian_rapidash"],
	adj: ["fur", "fluff", "fuzz"]
})
skinTypes.set("leathery", {
	species: ["sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash", "nidoran_f", "nidorina", "nidoqueen", "nidoran_m", "nidorino", "nidoking", "diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio"],
	adj: ["leathery skin"]
})
skinTypes.set("moist", {
	species: ["poliwag", "poliwhirl", "poliwrath", "tentacruel", "tentacool"],
	adj: ["moist skin"]
})
skinTypes.set("plant", {
	species: ["bellsprout", "victreebel", "weepinbell"],
	adj: ["plant-like"]
})
skinTypes.set("rock", {
	species: ["geodude", "alolan_geodude", "graveler", "alolan_graveler", "golem", "alolan_golem"],
	adj: ["rocky", "stone"]
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
	species: ["pidgey", "rattata", "alolan_rattata", "oddish", "paras"],
	slang: "dick_slang_small",
	adj: ["tiny"]
})
cockSizes.set("small", {
	species: ["bulbasaur", "charmander", "raticate", "alolan_raticate", "spearow", "ekans", "pikachu", "nidoran_f", "nidoran_m", "clefairy", "clefable", "vulpix", "alolan_vulpix", "jigglypuff", "wigglytuff", "zubat", "gloom", "parasect", "venonat", "psyduck", "abra", "machop", "bellsprout"],
	slang: "dick_slang_small",
	adj: ["tiny"]
})
cockSizes.set("large", {
	species: ["venusaur", "charizard", "wartortle", "pidgeot", "arbok", "ninetales", "alolan_ninetales", "vileplume", "venomoth", "persian", "alolan_persian", "poliwrath", "mankey", "tentacruel", "ponyta", "galarian_ponyta"],
	slang: "dick_slang_big",
	adj: ["tiny"]
})
cockSizes.set("huge", {
	species: ["blastoise", "nidoking", "nidoqueen", "arcanine", "primeape", "rapidash", "galarian_rapidash"],
	slang: "dick_slang_big",
	adj: ["tiny"]
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
	species: ["charmander", "charmeleon"],
	adj: ["two-legged reptile", "bipedal reptile"],
	dex: "bipedal reptiles that walk on their hind legs."
})
bodies.set("draconic_biped", {
	species: ["charizard"],
	adj: ["two-legged dragon", "bipedal dragon"],
	dex: "bipdel dragons."
})
bodies.set("turtle_biped", {
	species: ["squirtle", "wartortle", "blastoise"],
	adj: ["two-legged turtle", "bipedal turtle"],
	dex: "bipedal turtles."
})
bodies.set("snake", {
	species: ["ekans"],
	adj: ["snake", "serpent"],
	dex: "snakes."
})
bodies.set("cobra", {
	species: ["arbok"],
	dex: "cobras."
})

// amphibian
bodies.set("tadpole", {
	species: ["poliwag"],
	dex: "tadpoles."
})
bodies.set("frog", {
	species: ["poliwhirl", "poliwrath"],
	dex: "frogs."
})

// aquatic
bodies.set("squid", {
	species: ["tentacool", "tentacruel"],
	dex: "squids."
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

// avian
bodies.set("bird", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow"],
	adj: ["bird", "avian"],
	dex: "birds."
})
bodies.set("duck", {
	species: ["psyduck", "golduck"],
	dex: "ducks."
})

// mammal
bodies.set("mouse", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu"],
	adj: ["mouse", "rodent"],
	dex: "mice."
})
bodies.set("shrew", {
	species: ["sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash"],
	adj: ["shrew-like"],
	dex: "shrews."
})
bodies.set("rhino_quad", {
	species: ["nidoran_f", "nidorina", "nidoran_m", "nidorino"],
	adj: ["four-legged rhino", "rhino", "quadrupedal rhino"],
	dex: "quadrupedal rhinos."
})
bodies.set("rhino_biped", {
	species: ["nidoqueen", "nidoking"],
	adj: ["two-legged rhino", "bipedal rhino"],
	dex: "bipedal rhinos."
})
bodies.set("fox", {
	species: ["vulpix", "ninetails", "alolan_vulpix", "alolan_ninetales", "abra", "kadabra", "alakazam"],
	dex: "foxes."
})
bodies.set("bat", {
	species: ["zubat", "golbat"],
	dex: "bats."
})
bodies.set("cat_biped", {
	species: ["meowth", "galarian_meowth", "alolan_meowth"],
	adj: ["bipedal cat", "two-legged cat"],
	dex: "bipedal cats."
})
bodies.set("cat_quad", {
	species: ["persian", "alolan_persian"],
	adj: ["cat", "feline"],
	dex: "cats."
})
bodies.set("monkey", {
	species: ["mankey", "primeape"],
	dex: "monkeys."
})
bodies.set("canine", {
	species: ["growlithe", "arcanine"],
	adj: ["canine", "dog"],
	dex: "dogs."
})
bodies.set("humanoid", {
	species: ["machop", "machoke", "machamp"],
	adj: ["humanoid", "human-like"],
	dex: "humanoids."
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

// magical
bodies.set("fairy", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff"],
	dex: "fairies."
})

// mineral
bodies.set("floating_rock", {
	species: ["geodude", "alolan_geodude"],
	adj: ["floating rock"],
	dex: "floating rocks."
})
bodies.set("rock_golem", {
	species: ["graveler", "alolan_graveler", "golem", "alolan_golem"],
	adj: ["rock golem"],
	dex: "rock golems."
})

// plant
bodies.set("weed", {
	species: ["oddish"],
	adj: ["weed-like"],
	dex: "weeds."
})
bodies.set("flower", {
	species: ["gloom", "vileplume"],
	dex: "flowers."
})
bodies.set("pitcher_plant", {
	species: ["bellsprout", "weepinbell", "victreebel"],
	adj: ["pitcher plant"],
	dex: "pitcher plants."
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
	species: ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "aerodactyl"],
	adj: ["lizard /a <ds>", "reptile /a <ds>", "/a <ds>"],
	pussy_adj: ["lizard /a <ps>", "reptile /a <ps>", "/a <ps>"],
	dex: "Male <lp> have a reptilian cock that slides out of a sheath when aroused. Their testicles are internal. <n> penises are pink and slick."
})
dicks.set("draconic", {
	species: ["charizard", "gyarados", "dragonite"],
	adj: ["dragon /a <ds>", "draconic /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a draconic cock with pleasurable ridges and a hard knot at the base. Their testicles are external. When not aroused, a male <ln>'s penis is hidden in a fleshy protective sheath."
})
dicks.set("turtle", {
	species: ["squirtle", "wartortle", "blastoise"],
	adj: ["turtle /a <ds>", "prehensile /a <ds>", "/a <ds>"],
	pussy: "reptilian",
	dex: "Male <lp> have a long, pink, slick cock that hides inside their body when not in use. Their penises are prehensile and they can move them freely. <p> have internal testicles."
})
dicks.set("insect", {
	species: ["caterpie", "metapod", "butterfree", "weedle", "metapod", "paras", "parasect", "venonat", "venomoth", "scyther", "pinsir", "kabuto", "kabutops"],
	adj: ["/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a cock that hides beneath their chitinous exoskeleton when not in use. Their testicles are internal."
})
dicks.set("avian", {
	species: ["pidgey", "pidgeotto", "pidgeot", "spearow", "fearow", "psyduck", "golduck", "farfetch'd", "galarian_farfetch'd", "doduo", "dodrio", "aricuno", "galarian_articuno", "zapdos", "galarian_zapdos", "moltres", "galarian_moltres"],
	adj: ["bird /a <ds>", "avian /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a slick, pink, curved cock. A male <ln>'s penis hides inside his body when not in use. Male <lp> have internal testicles."
})
dicks.set("rodent", {
	species: ["rattata", "alolan_rattata", "raticate", "alolan_raticate", "pikachu", "raichu", "alolan_raichu", "sandshrew", "sandslash", "alolan_sandshrew", "alolan_sandslash"],
	adj: ["mouse /a <ds>", "/a <ds>"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a pink penis that lies inside a protective fleshy sheath. When aroused, the penis comes out of its sheath."
})
dicks.set("snake", {
	species: ["ekans", "arbok", "onix"],
	adj: ["snake /a <ds>", "twin /a <ds>", "double /a <ds>", "dual /a <ds>", "/a <ds>"],
	pussy: "reptilian",
	dex: "Male <lp> have two reptilian penises right beside each other. Their dual penises are slick and pink, and they retract inside the body when not in use. Male <ln>'s have internal testicles. Male <lp> are known for using both of their penises at once on a partner. They love fucking their partner with both of their dicks.",
	plural: true,
})
dicks.set("rhino", {
	species: ["nidoran_f", "nidorina", "nidoqueen", "nidoran_m", "nidorino", "nidoking", "rhyhorn", "rhydon"],
	adj: ["rhino /a <ds>", "rhinoceros /a <ds>", "/a <ds>"],
	pussy: "",
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a long pink penis with a dramatically flared tip. When they're about to cum, the tip of their penis flares up and expands. A <p>'s penis is also prehensile and can be fully controlled. When not in use, the penis is hidden inside a protective fleshy sheath."
})
dicks.set("generic_sheath", {
	species: ["clefairy", "clefable", "jigglypuff", "wigglytuff", "zubat", "golbat", "chansey", "kangaskhan", "electabuzz", "magmar"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: dicks.get("rodent").dex
})
dicks.set("generic_slit", {
	species: ["poliwag", "poliwhirl", "poliwrath"],
	adj: ["animal /a <ds>", "animalistic /a <ds>", "/a <ds>"],
	pussy: "generic_sheath",
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a slick, pink penis that hides inside their body when not aroused. They also have internal testicles."
})
dicks.set("fox", {
	species: ["vulpix", "alolan_vulpix", "ninetales", "alolan_ninetales", "abra", "kadabra", "alakazam", "cubone", "marowak", "alolan_marowak", "eevee", "jolteon", "flareon"],
	adj: ["fox /a <ds>", "vulpine /a <ds>", "/a <ds>"],
	pussy: "generic_sheath",
	dex: dicks.get("generic_sheath").dex + " At the base of a <ln>'s penis is a thick fleshy knot, which expands when he's getting close to orgasm."
})
dicks.set("vine", {
	species: ["oddish", "gloom", "vileplume", "bellsprout", "weepinbell", "victreebel", "exeggutor", "alolan_exeggutor"],
	adj: ["slimy vine /a <ds>", "slimy tentacle /a <ds>", "/a <ds>"],
	pussy: "",
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have several vines which function as penises. These penis vines are long and fully prehensile. Vine cocks have a head like a human's penis, and a retractable foreskin. Vine penises are very slick and slimy, and male <lp> love to use multiple at a time to fuck their partners. Cock vines can cum just like any other penis.",
	plural: true,
})
dicks.set("self", {
	species: ["diglett", "alolan_diglett", "dugtrio", "alolan_dugtrio", "exeggcute"],
	adj: ["/a <ds>"],
	pussy: "generic_sheath",
	dex: "No one knows how <lp> reproduce, but that doesn't stop people from having sex with them. They love to be shoved into people's various holes, and it seems they can have some type of orgasm from it."
})
dicks.set("feline", {
	species: ["meowth", "alolan_meowth", "galarian_meowth", "persian", "alolan_persian", "mewtwo", "mew"],
	adj: ["feline /a <ds>", "barbed /a <ds>", "/a <ds>"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a pink penis with soft barbs on the end. The barbs don't hurt, they feel pleasant. When not aroused, a <p>'s penis is hidden in a protective fleshy sheath."
})
dicks.set("human", {
	species: ["mankey", "primeape", "machop", "machoke", "hitmonlee", "hitmonchan", "mr._mime", "galarian_mr._mime", "jynx"],
	adj: ["human-like /a <ds>", "humanoid /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a human-like penis complete with a foreskin and a scrotum with two testicles."
})
dicks.set("human_double", {
	species: ["machamp"],
	adj: ["human-like /a <ds>", "humanoid /a <ds>", "/a <ds>", "twin /a <ds>", "double /a <ds>", "dual /a <ds>"],
	pussy: "humand",
	dex: "Male <lp> have two large penises. When fucking females they love to put their cocks in both holes at once. The two big penises of male <lp> are veiny and muscular. The male <lp> love penetrating their partner with both of their penises at once.",
	plural: true,
})
dicks.set("canine", {
	species: ["growlithe", "arcanine"],
	adj: ["knotted dog /a <ds>", "knotted canine /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a pink dog penis. A male <p>'s penis has a thick fleshy knot at the base, which expands and lodges him inside his partner when he orgasms. Once a male <p> has knotted his partner, they'll be stuck together until his penis goes soft again. When his penis isn't in use, it's hidden in a protective fleshy sheath."
})
dicks.set("tentacle", {
	species: ["tentacool", "tentacruel", "tentacle", "omanyte", "omastar"],
	adj: ["slimy tentacle /a <ds>", "writhing tentacle /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have several tentacles. One of their tentacles is actually their penis. A male <p>'s penis tentacle looks like any other tentacle, but it releases cum when he orgasms. When a male <p> has sex, he uses all his tentacles to pleasure his partner.",
	plural: true,
})
dicks.set("rock", {
	species: ["geodude", "graveler", "golem", "alolan_geodude", "alolan_graveler", "alolan_golem"],
	adj: ["rock-hard /a <ds>", "rock /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a penis made entirely out of rock. Despite the hardness of the penis, it's very warm and comfortable"
})
dicks.set("equine", {
	species: ["ponyta", "galarian_ponyta", "rapidash", "galarian_rapidash"],
	adj: ["horse /a <ds>", "equine /a <ds>", "horsecock", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a long horse cock. Their equine penises are normally stored within a fleshy sheath, but when aroused they increase in size rapidly. A male <p>'s penis has a muscular band around the middle, and a large flat head at the tip. The head of the penis will flare up with the pokemon reaches orgasm."
})
dicks.set("porcine", {
	species: ["slowpoke", "galarian_slowpoke", "slowbro", "glaarian_slowbro", "drowzee", "hypno"],
	adj: ["/a <ds>"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a long, thin, pink penis. A male <p>'s penis normally hides within a protective fleshy sheath when not aroused. They also have massive testicles."
})
dicks.set("electric_disembodied", {
	species: ["magnemite", "magneton", "voltorb", "electrode", "porygon"],
	adj: ["magically electric /a <ds>", "pleasantly electric /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> reproduce using a penis made of magical electric energy. The penis is used like a dildo, and it's voltage is low enough that it's extremely pleasurable and doesn't shock the user."
})
dicks.set("cetacean", {
	species: ["seel", "dewgong", "lapras", "vaporeon", "dratini", "dragonair"],
	adj: ["prehensile /a <ds>", "muscular /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have a long, slick, pink penis. A male <p>'s penis is prehensile and can be controlled freely. When not aroused, a male <p>'s penis retracts into a slit in its body. Male <lp> have internal testicles."
})
dicks.set("slime", {
	species: ["grimer", "alolan_grimer", "muk", "alolan_muk"],
	adj: ["slime /a <ds>", "slimy /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> reproduce by forming their slime into the shape of a penis and using it to fuck their partner. A <p>'s slime penis can be reshaped and resized to do any kinky thing he wants."
})
dicks.set("tongue", {
	species: ["shellder", "cloyster", "lickitung"],
	adj: ["tongue-/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "A male <p>'s tongue is actually his penis. He has a long prehensile tongue that he uses to fuck his partner. When he reaches orgasm, the male <p> cums from the tip of his tongue."
})
dicks.set("psychic_disembodied", {
	species: ["gastly", "haunter", "koffing", "weezing", "galarian_weezing", "staryu", "starmie"],
	adj: ["ethereal floating /a <ds>", "psychically floating /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp>'s lack a physical penis, but they can manifest a magical penis using psychic energy. A partner can use the male <p>'s psychic penis like a dildo, and it can orgasm like a normal penis."
})
dicks.set("psychic", {
	species: ["gengar"],
	adj: ["psychic /a <ds>", "glowing /a <ds>", "/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> don't have physical penises, but they create them out of psychic energy when aroused. An observer would see the male <p>'s penis phase into existence on its crotch."
})
dicks.set("crustacean", {
	species: ["krabby", "kingler"],
	adj: ["/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> have an internal penis that comes out of their body when aroused."
})
dicks.set("fish", {
	species: ["horsea", "seadra", "goldeen", "seaking", "magikarp"],
	adj: ["slick /a <ds>", "tapered /a <ds>", "/a <ds>"],
	pussy: "cetacean",
	dex: "Male <lp> have an internal penis that comes out of their body when aroused."
})
dicks.set("bovine", {
	species: ["tauros"],
	adj: ["bull /a <ds>", "bovine /a <ds>", "/a <ds>"],
	pussy: "generic_sheath",
	dex: "Male <lp> have a bull penis. It's long and pink. Male <lp> also have massive testes."
})
dicks.set("ditto", {
	species: ["ditto"],
	adj: ["/a <ds>"],
	pussy_adj: ["/a <ps>"],
	dex: "${plural} can transform any part of their body into anything imaginable. They frequently transform during sex to keep things exciting and interesting. When having sex with a <p> you make feel him transforming inside you and he may change appearance throughout the fuck session."
})
dicks.set("ovipositor", {
	species: ["beedrill"],
	adj: ["<ds>-like ovipositor", "ovipositor", "sexual appendage"],
	pussy_adj: ["/a <ps>"],
	dex: "Male <lp> use a specialized ovipositor as a penis. His ovipositor functions just like a penis. When a male <p> cums, he pumps eggs through his ovipositor into his partner. He doesn't ejaculate semen, he only releases large eggs when he cums. This makes his partner feel really good."
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
	description: "The bulbasaur has a /a plant /a green bulb on its back."
})
special.set("ivysaur", {
	description: "The ivysaur has a /a plant /a pink flower bud on its back, nestled in a bush of /a green leaves."
})
special.set("venusaur", {
	description: "The venusaur has a large /a plant /a pink flower on its back. It emits an intoxicatingly arousing odor."
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
	data.special = value
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
	if (data.special && data.special.subspeciesOf) {
		str = str + ` ${data.name_word} is a subspecies of ${getSpecies(data.special.subspeciesOf).name_word}.`
	}

	// body dex entry
	if (data.body_dex_entry) {
		str = str + " " + data.body_dex_entry
	}

	// dick dex entry
	if (data.dick_dex_entry) {
		str = str + " " + data.dick_dex_entry
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

//////////////////////
// INTRO DESCRIPTOR //
//////////////////////
tagFunctions.set("intro", {
	// 0: species
	// 1: gender
	// 2: context id (0: standard, 1: partner pokemon first encounter)
	args: 3,
	call: function(args) {
		var s = getSpecies(args[0])
		var m = isMale(args[1])
		var f = isFemale(args[1])
		
		// user gender
		var userGender = load("user_def_gender")
		var userHasCock = userGender ? isMale(userGender) : false
		var userHasPussy = userGender ? isFemale(userGender) : false
		
		// start
		var str = ""

		// descriptors
		var dick = dicks.get(s.dick)
		var dick_slang = cockSizes.get(s.cockSize).slang

		if (dick.plural) {
			dick_slang = dick_slang + "_plural"
		}
console.log(s)
		function cockType() {
			return adj("dick_"+s.dick)
		}
		function cockSize() {
			return adj("dick_"+s.cockSize)
		}
		function cock() {
			if (s.cockSize != "medium") {
				return cockSize() + " " + cockType()
			} else {
				return cockType()
			}
		}
		function pussy() {
			return adj("pussy_"+s.pussy)
		}
		function skin() {
			return adj("pretty") + " " + adj(s.bodyColor) + " " + adj("skintype_"+s.skinType)
		}
		function body() {
			return adj("bodysize_"+(s.bodySize)) + " " + adj(s.bodyColor) + " " + adj("body_"+s.body)
		}

		str = `a ${body()} pokemon with ${skin()}. ${m ? "He's" : f ? "She's" : "It's"} clearly ${m ? "male" : f ? "female" : "excited"}.`

		if (s.special && s.special.description) {
			str = str + " " + s.special.description
		}
		if (m && s.special && s.special.description_m) {
			str = str + " " + s.special.description_m
		}
		if (f && s.special && s.special.description_f) {
			str = str + " " + s.special.description_f
		}

		if (args[2] == 1) {
			str = str + ` Your new ${s.name_word.toLowerCase()} looks at you with curiosity. ${m ? "He" : f ? "She" : "It"} seems /gp <g> 0 knows what you want, as`
			
			if (m) {
				str = str + ` his ${cock()} ${dick.plural ? "are" : "is"} already beginning to harden. He must be excited for what's about to happen.`
				
				if (userHasPussy) {
					str = str + ` You lay back on the bed and spread your legs, showing him your moist pussy. You spread it a bit so your ${s.name_word.toLowerCase()} can clearly see that you want his ${cock()} inside you.`
				} else if (userHasCock) {
					str = str + ` You grab your own cock and shake it at him in a crude display of desire. The ${s.name_word.toLowerCase()} is clearly interested, his ${cock()} now leaking precum onto the floor.`
				} else {
					str = str + ` You present yourself to him and tease him with your body. You can tell your ${s.name_word.toLowerCase()} is getting excited by his ${cock()} dripping precum onto the floor.`
				}
			} else if (f) {
				str = str + ` her ${pussy()} juices are already dripping down her leg. She must be excited for what's about to happen.`
				
				if (userHasCock) {
					str = str + ` You grab your cock and shake it at her in a crude display of primal desire. Your ${s.name_word.toLowerCase()} is clearly interested, and she moves in closer.`
				} else if (userHasPussy) {
					str = str + ` You spread yourself and rub your labia in a display of raw desire. Your ${s.name_word.toLowerCase()} notices and moves in closer.`
				} else {
					str = str + ` You present yourself, dislpaying your unabashed need to the already-soaking ${s.name_word.toLowerCase()}. She can't wait any more than you can at this point.`
				}
			} else {
				if (userHasCock) {
					str = str + ` you grab your cock and shake it at it in a crude display of primal desire. Your ${s.name_word.toLowerCase()} is clearly interested, and it moves in closer.`
				} else if (userHasPussy) {
					str = str + ` you spread yourself and rub your labia in a display of raw desire. Your ${s.name_word.toLowerCase()} notices and moves in closer.`
				} else {
					str = str + ` you present yourself, dislpaying your unabashed need to the already-horny ${s.name_word.toLowerCase()}. It can't wait any more than you can at this point.`
				}
			}
		}

		str = replaceAll(str, "<g>", m ? "m" : f ? "f" : "t")
		str = replaceAll(str, "<ds>", dick_slang)
		str = replaceAll(str, "<ps>", "pussy_slang")
		
		return str
	}
})
