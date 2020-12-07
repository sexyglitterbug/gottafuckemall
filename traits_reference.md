# Traits
When you're prompted to input a pokemon species, you can input "x" to say "give me a random pokemon". You can add qualifiers to this, which will refine the possible results. For example, inputting "x[bodysize_large+cocksize_large]" will give you a random pokemon with a large body and large cock.

The symbol `+` will separate terms that must be matched in order for a pokemon to be considered. The symbol `;` can be used to create a list of traits where, if any of those traits match, the entire term matches. For example,

> x[cocksize_large;cocksize_huge;cocksize_colossal+bodysize_large;bodysize_huge]

translates to "(cocksize_large or cocksize_huge or cocksize_colossal) and (bodysize_large or bodysize_huge)". Again, separating traits with `;` allows any number of them to fail, as long as one matches.

This page is a reference doc for the traits that you can search for this way. I'll add traits for cock types and body types once I get a good plan for it.

Tip: you can also write a pokemon's name directly instead of writing a trait. For example, `cocksize_huge;bulbasaur` will match both bulbasaur and anything that has a huge cock.

Bonus Tip: Use the scene `rand` to test your random string. This scene will print out the list of pokemon that matched your input.

# bodysize
bodysize_ | Example
--------- | -------
tiny | caterpie, surskit
small | wooper, clamperl
medium
large | venusaur, regice
huge | zapdos, magmortar
gigantic | steelix, dialga

# bodycolor
bodycolor_ | Example
---------- | -------
red
purple
blue
bluegreen
green
yellow
orange
tan
brown
black
grey
white
pink
lightblue

# skintype
skintype_ | Example
--------- | -------
scales | bulbasaur, milotic
chitin | ariados, skorupi
feathers
fur
wool | mareep, ampharos
leathery | nidoqueen, grotle
moist | octillery, piplup
plant | sunkern, roserade
bark | exeggutor, sudowoodo
rock | onix, regirock
metal | skarmory, magnezone
slime | grimer, slugma
shell | cloyster, kabutops
ghost | gengar, dusclops
plastic | porygon, voltorb
silk | silcooon, cascoon
cloud | castform
fabric | shuppet, drifloon
ice | glalie, regice

# cocksize
cocksize_ | Example
--------- | -------
tiny | elekid, budew
small | farfetch'd, gligar
medium
large | ponyta, scizor
huge | articuno, rampardos
colossal | gyarados, mamoswine