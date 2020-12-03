const modifier = (text) => {
  let modifiedText = text

  // scene selection
  if (!load("SCENE_SELECTION_COMPLETE") && false) {
    var index = parseInt(text);
    if (index && scenario_options[index]) {
      save("SCENE_SELECTION_COMPLETE", "1")
      save("STOP_FROM_CONTEXT", "1")
      modifiedText = scenario_options[index].prompt
    } else {
      if (text.substr(0, 1) != "/") {
        save("STOP_FROM_CONTEXT", "1")

        if (load("DID_FIRST_MESSAGE")) {
          modifiedText = `Unrecognized input "${text}". Please input a number.`
        } else {
          save("DID_FIRST_MESSAGE", "1")
        }
      }
    }
  }

  const lowered = text.toLowerCase()

  state.message = ""
  
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
  
  return { text: modifiedText }
}

modifier(text)
