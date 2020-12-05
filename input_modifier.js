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
			console.log(`${trim} : ${scene}`)
			if (scene) {
				save("SCENE_SELECTION_COMPLETE", "1")
				save("SELECTED_SCENE", trim.toLowerCase())
				modifiedText = ''
				stop_ai()
			} else if (modifiedText.length > 0 && modifiedText.substr(0, 1) != "/") {
				stop_ai()

				if (load("DID_FIRST_MESSAGE") == "1") {
					state.message = `Unrecognized input "${trim.toLowerCase()}. Please input a scene name such as "starter" or "sex_ed".\n\nYou can find a list of scenes at the link in the description.`
				} else {
					save("DID_FIRST_MESSAGE", "1")
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
			modifiedText = "You're a pokemon trainer. "
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
