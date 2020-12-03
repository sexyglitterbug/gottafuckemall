/*
/scenario_starter ${What gender are you? (Use underscores instead of spaces, e.g. trans_girl)} ${What species is your partner pokemon? (Use underscores instead of spaces, e.g. \"galarian_zapdos\")} ${What gender is your pokemon?}
*/

function display_scenario_menu() {
  var str = ``
  scenario_options.forEach(function(value, index) {
    str = str + `${index}: ${value.peek}\n`
  })

  state.message = str
}

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

  // display menu first time
  if (load("SCENE_MENU_DISLPAYED") != "1") {
    modifiedText = ""
    display_scenario_menu()
    save("SCENE_MENU_DISLPAYED", "1")
    stop_ai()
  }
  // scene selection
  if (load("SCENE_SELECTION_COMPLETE") != "1") {
    var trim = trim_input_fluff(modifiedText)
    var index = parseInt(trim);

    if ((index || index == 0) && scenario_options[index]) {
      save("SCENE_SELECTION_COMPLETE", "1")
      save("SELECTED_SCENE", index)
      modifiedText = ""
      stop_ai()
    } else if (modifiedText.length > 0 && modifiedText.substr(0, 1) != "/") {
      stop_ai()

      if (load("DID_FIRST_MESSAGE")) {
        state.message = `Unrecognized input "${trim}". Please input a number. Input "menu" to display the menu again.`

      } else {
        save("DID_FIRST_MESSAGE", "1")
      }
    }
  }

  // scene args
  if (load("SCENE_SELECTION_COMPLETE") == "1" && load("SCENE_PREPARED") != "1") {
    var stage = load("SCENE_PREP_STAGE")
    var scenario = scenario_options[parseInt(load("SELECTED_SCENE"))]

    if (stage || stage == "0") {
      // process text as an argument to the scene
      save("STAGE_ARG_"+stage, trim_input_fluff(modifiedText))
      stage = parseInt(stage) + 1
    } else {
      stage = 0
    }
console.log(`SCENE: ${stage} : ${scenario.args.length}`)
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
    }
  }

  // tag processor
  const lowered = modifiedText.toLowerCase()
  
  parsedSomething = true
  searchSub = lowered
  searchSubOffset = 0
  while (parsedSomething) {
    parsedSomething = false
    
    tagStart = searchSub.search("/")
    commandLength = 0
    if (tagStart != -1) {
      // found a tag
      searchSub = searchSub.substr(tagStart+1)
      lookingForArgs = 0
      foundKey = false
      args = []
      func = {}
      commandLength = commandLength + 1
      
      while ((foundKey == false || lookingForArgs > args.length) && searchSub.length > 0) {
        // collect args
        nextSpace = searchSub.search(" ")
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
          save("STOP_FROM_CONTEXT", "1")
          break // don't re-parse the commands in the help menu
        }
      }
    }
  }

  if (modifiedText.length == 0) {
    if (history.length == 0) {
      modifiedText = "You're a pokemon trainer."
    } else {
      modifiedText = null
    }
  }

  console.log("INPUT WAS: " + text + " \nMODIFIED TO: " + modifiedText + " \nMESSAGE: " + state.message)
  
  return { text: modifiedText }
}

modifier(text)
