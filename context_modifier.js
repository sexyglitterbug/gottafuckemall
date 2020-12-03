
// Checkout the repo examples to get an idea of other ways you can use scripting
// https://github.com/AIDungeon/Scripting/blob/master/examples

// info.memoryLength is the length of the memory section of text.
// info.maxChars is the maximum length that text can be. The server will truncate the text you return to this length.

// This modifier re-implements Author's Note as an example.
const modifier = (text) => {
  var finalText = text

  if (load("STOP_FROM_CONTEXT") == "1") {
    save("STOP_FROM_CONTEXT", "0")
    return { stop: true }
  }

  return { text: finalText }
}

// Don't modify this part
modifier(text)
