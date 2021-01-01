# Custom Scenarios
Instead of picking from a preset scenario, you can write your own or input scenarios other players have made! When the game prompts you for a scenario, simply type `:` followed by your own story.

Example:
* You say: `: pokemon trainer.`
* Game says: `You're a pokemon trainer.`

Now you know how to write a custom story! There are some details to consider when writing custom stories, which are laid out in this guide.

Remember: All stories automatically start with `You're a`.

# Pokemon Species
Pokemon species definitions are generated when the story requests them. For custom stories, the game will scan your story for pokemon names and load their data if it finds any. This works well in the vast majority of cases.

In certain cases you may want more control. For example, if you want a galarian mr. mime or some other specific permutation of a pokemon. In these cases you can set up a JSON table at the beginning of your story to be parsed by the game.

The parameter for loading pokemon species is called `pokemon` and its value is an array of strings.

Example: 
* You say: `:{"pokemon":["machamp","victreebel"]} pokemon trainer.`
* Game says: `You're a pokemon trainer.`
* And the game will load machamp and victreebel's data.

In addition to supplying the pokemon name, you can suffix it with additional parameters to make things easier on the AI. If you know the pokemon's sex you can add `:m` or `:f` to load the gendered data.

Note that supplying a `pokemon` parameter will stop the game from scanning your story for pokemon names. If you include a `pokemon` array, you should include every pokemon that you wish to be loaded.

# Mystery Dungeon Scenarios
Mystery dungeon scenarios allow all pokemon to talk. To make your scenario a mystery dungeon scenario, simply add `"md":true` to your scenario options.

Example:
* You say: `:{"md":true} pokemon trainer.`
* Game says: `You're a pokemon trainer.`
* And the game will know that pokemon can talk.

# Complete Example
Here is a complete example of a simple custom scenario. You can paste this directly into the game to run it and try it out.

> :{"md":true,"pokemon":["riolu:m","ampharos:f"]} male riolu. You're watching tv when your friend Ampharos walks in. She looks distressed.
> 
> "What's wrong?" You ask
> 
> Ampharos blushes and looks away. "I'm in heat and I don't have a mate."
> 
> "Oh," you say. "I could be your mate for tonight."
> 
> Ampharos lights up. "Really?! Thank you so much!" She hops on the couch next to you and eyes your flaccid cock. You know what she's thinking.
```