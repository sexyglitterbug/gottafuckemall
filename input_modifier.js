// We can trim Do/Say/Story inputs to isolate the actual user input
// For arg prompts
var trims = [
	{
		prefix: "\n> You say \"",
		suffix: "\""
	},
	{
		prefix: "\n> You ",
		suffix: ".\n"
	},
	{
		prefix: "\n",
		suffix: ""
	}
]
function trim_input_fluff(str) {
	for (var i=0; i<trims.length; i++) {
		var trim = trims[i]
		if (str.substr(0, trim.prefix.length) == trim.prefix && str.substr(str.length - trim.suffix.length, str.length) == trim.suffix) {
			return str.substr(trim.prefix.length, str.length - (trim.prefix.length+trim.suffix.length))
		}
	}
	return str
}

const modifier = (text) => {
	let modifiedText = text

	state.message = ""

	if (!state.debug) {
		// new menu: just ask for a scene name
		// scene list menu doesn't render well after like 3 options :(
		if (load("SCENE_MENU_DISLPAYED") != "1") {
			modifiedText = ""
			state.message = `Type the name of a scene below, such as "starter" or "sex_ed".\nSee the link in the description for a full list of scenes.`
			save("SCENE_MENU_DISLPAYED", "1")
			stop_ai()
		}
		if (load("SCENE_SELECTION_COMPLETE") != "1") {
			var trim = trim_input_fluff(text)
			var scene = scenario_options[trim.toLowerCase()]

			if (trim == "x") { // random scene
				while (true) {
					var key = getRandomKey(scenes)
					scene = scenario_options[key]
					if (!scene.hidden) {
						break
					}
				}
			}

			if (scene) {
				save("SCENE_SELECTION_COMPLETE", "1")
				save("SELECTED_SCENE", scene.name)
				modifiedText = ''
				stop_ai()
			} else if (trim.length > 0) {
				if (trim.substr(0, 1) == ":") {
					// custom scenario
					modifiedText = trim.substr(1)

					var options

					if (modifiedText.substr(0, 1) == "{") {
						var options_str = modifiedText.match(/{.*}/)
						if (options_str) {
							options_str = options_str[0]
						}

						if (options_str) {
							modifiedText = modifiedText.substr(options_str.length)

							try {
								options = JSON.parse(options_str)
							} catch(err) {
								modifiedText = "Error parsing arguments: " + err + "\n\n\n"
							}
						}
					}

					var is_mystery_dungeon = false
					if (options && options.md) {
						is_mystery_dungeon = true
					}

					add_category_context(is_mystery_dungeon ? "md" : "regular")

					if (options && options.pokemon) {
						options.pokemon.forEach(function(name) {
							var species_name = name

							var first_arg = name.search(":")
							if (first_arg != -1) {
								species_name = name.substr(0, first_arg)
							}

							var gender_m = name.search(/:m:|:m$/) != -1
							var gender_f = name.search(/:f:|:f$/) != -1
							var gender = gender_m ? (gender_f ? "herm" : "male") : gender_f ? "female" : null

							load_species(species_name, gender, is_mystery_dungeon ? "md" : "feral")
						})
					} else {
						species.forEach(function(v, name) {
							if (modifiedText.search(name) > -1) {
								load_species(name, "herm", "feral")
							}
						})
						alias
					}

					save("SCENE_SELECTION_COMPLETE", "1")
					save("SCENE_PREPARED", "1")
				} else if (trim.substr(0, 1) == "/") {
					// command
					modifiedText = trim
					state.message = `Processed command`
				} else {
					stop_ai()
					modifiedText = ""
					if (load("DONE_FIRST_MESSAGE") != "1") {
						save("DONE_FIRST_MESSAGE", "1")
					} else {
						state.message = `Unrecognized input "${trim.toLowerCase()}". Please input a scene name such as "starter" or "sex_ed".\n\nYou can find a list of scenes at the link in the description.`
					}
				}
			}
		}

		// prompt for scene args
		if (load("SCENE_SELECTION_COMPLETE") == "1" && load("SCENE_PREPARED") != "1") {
			var stage = load("SCENE_PREP_STAGE")
			var scenario = scenario_options[load("SELECTED_SCENE")]

			if (stage || stage == "0") {
				// process text as an argument to the scene
				save("STAGE_ARG_"+stage, trim_input_fluff(modifiedText))
				stage = parseInt(stage) + 1
			} else {
				stage = 0
			}

			if (stage < scenario.args.length) {
				// prompt for next arg
				state.message = scenario.args[stage].word
				save("SCENE_PREP_STAGE", stage)
				stop_ai()
				modifiedText = ""
			} else {
				// done inputting args. output result to context.
				var str = scenario.prompt
				for (var i=0; i < scenario.args.length; i++) {
					str = replaceAll(str, scenario.args[i].key, load("STAGE_ARG_"+i))
				}
				modifiedText = str
				save("SCENE_PREPARED", "1")

				if (scenario.temp_context) {
					scenario.temp_context.forEach(context => add_temp_context(context.lifetime, context.str))
				}
				if (scenario.context) {
					add_context(scenario.context)
				}
			}
		}
	}

	// tag processor
	modifiedText = process_tags(modifiedText)

	// have to give AID something non-empty for the first message
	/// or else we'll go on an adventure in larion
	if (modifiedText.length == 0) {
		if (history.length == 0) {
			modifiedText = "You're a"
		} else {
			modifiedText = null
		}
	}

	// dynamic context
	tick_context()
	get_context()

	// debug
	//console.log("INPUT WAS: " + text + " \nMODIFIED TO: " + modifiedText + " \nMESSAGE: " + state.message)
	
	// output
	return { text: modifiedText }
}

modifier(text)
