# Google Maps Link Debug

## Finding
The "View on Google Maps" link in the expanded property row has the CORRECT href:
`https://www.google.com/maps/search/?api=1&query=411%20LANDMARK%20DR%2C%20BELHAVEN%2C%20NC%2027810`

This URL format is correct and should work. The address "411 LANDMARK DR, BELHAVEN, NC 27810" is properly encoded.

## Possible Issue
The user reported that "Google maps opens but no address is populated". This could be:
1. The Google Maps proxy intercepting the link and stripping the query parameter
2. The embedded Google Maps link (from the map component) being clicked instead of the "View on Google Maps" button
3. A redirect issue where the proxy URL doesn't pass through the query parameter

## The map component's built-in Google Maps link
The map component has its own link: `https://maps.google.com/maps?ll=35.55,-79.39&z=7&t=m&hl=en-US&gl=US&mapclient=apiv3`
This is the generic "Open this area in Google Maps" link from the Google Maps API - it just opens the current map view, NOT a specific property address.

## Diagnosis
The user may be clicking the Google Maps logo/link on the embedded map (which opens the general map area) rather than the "View on Google Maps" button in the expanded property row. OR the proxy is interfering with the external link.

Need to test by actually clicking the "View on Google Maps" button.
