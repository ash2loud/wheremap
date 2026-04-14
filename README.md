# KNOWN ISSUES

VERY long story short, I couldn't get this to run properly on Android or the Web.

On the web version, the react native function for maps simply does not render, and 
for the Android version, the tiles don't render.

If you run this on an iPhone or in a Snack with the iPhone emulator, it should work 
perfectly fine, assuming you have the API key dropped in.

# SETUP

Forewarning; I am running this with the Expo SDK version 52.0.0

## INSTRUCTOR(s)

On my submission to Canvas, I have provided my personal API key for Google Maps.
You can use your own, I don't mind. 
I set it up this way to simplify development, as I don't plan to use this outside 
of this class, and I don't want an API key exposed to the world over GitHub.

### PLACEHOLDER SWAP

There's 2 ways to go about this. All placeholders will read "apikeygoeshere".
Doing both won't hurt anything, just trying to make things easier.

**The simplest option**; If you go into App.js, line 19 will have a constant, with 
a placeholder. Please swap out the placeholder with the API key.

**The backup**; If youy open app.json, there will be 3 instances of a placeholder, on
lines 12, 22, and 42. Please just paste the API key over those placeholders.

## ANYONE ELSE

You'll need to grab your own API key from Google Cloud. Once you have one,
there are a handful of placeholders you'll need to replace that API key with.
They will all read "apikeygoeshere", and they are on line 19 of App.js, and 
on lines 12, 22, and 42 in app.json.