const modifier = (text) => {
	var finalText = text

	if (load("STOP_FROM_CONTEXT") == "1") {
		save("STOP_FROM_CONTEXT", "0")
		return { stop: true }
	}

	return { text: finalText }
}

modifier(text)