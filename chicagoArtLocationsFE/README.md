**API Calls made**
  - initial page load and current location change [GET Request]:
    ```
    axios.get(
        http://localhost:8000/newsearch/?lat= +
          currentLocation.latitude +
          '&long=' +
          currentLocation.longitude +
          '&searchQuery=' +
          searchQuery +
          '&minDistance=0' ----> minDistance = return only points that are at least as far away from currentLocation as minDistance
      )
    ```
  - when user scrolls to bottom of location results [GET Request]
    ```
    axios.get(
        http://localhost:8000/newsearch/?
         lat=${currentLocation.latitude}
         &long=${currentLocation.longitude}
         &searchQuery=${finalSearchInput}
         &minDistance=${farthestDistance},
    )
    ```
 - when the search query changes [GET Request]
   ```
   axios.get(
         http://localhost:8000/newsearch/?
         lat=${currentLocation.latitude}
         &long=${currentLocation.longitude}
         &minDistance=${0}
         &searchQuery=${searchQuery},
   )
   ```
**On every update of the search results array**
1. collect all the mural_registration_ids of each result(every result has a unique one)
2. remove all markers that are not in the results collection of mural_registration_ids
3. Go through each result and create a new marker of that result if it doesn't exist in the DOM already 
    

## On formatting and making files more readable and organized (prettier and eslit)

1. eslint vs prettier 

Prettier handles formatting (max line length) —> makes the code prettier
ESLint handle formatting, and code quality(unused vars) 


eslint rules that can be auto-fixed: https://eslint.org/docs/latest/rules/ (the auto-fix ones have a wrench next to them)
Prettier can auto fix 

<img width="282" height="206" alt="Screenshot 2026-01-25 at 10 03 17 PM" src="https://github.com/user-attachments/assets/812e0ac9-7d8b-4b47-89eb-3ccfa9b5b6f9" />


2. In settings.json

<img width="608" height="139" alt="Screenshot 2026-01-25 at 10 07 20 PM" src="https://github.com/user-attachments/assets/fb3967bf-ba0c-45bb-81e3-5f4153b78e84" />

Set prettier as default formatter:
Install prettier as a viscose extension 

<img width="456" height="257" alt="Screenshot 2026-01-25 at 10 17 10 PM" src="https://github.com/user-attachments/assets/2a498fd6-fdd5-4595-b67e-6e5e3e29c760" />


Then add into settings json
* editor.formatOnSave: Runs Prettier (breaks long lines)
* source.fixAll.eslint: Fixes auto-fixable ESLint rules


3. Purpose of eslint-config-prettier in eslint.config.mjs file: CONFLICT RESOLUTION

<img width="554" height="89" alt="Screenshot 2026-01-25 at 10 21 20 PM" src="https://github.com/user-attachments/assets/cb07617a-5e51-4994-8620-bfe9739b7a89" />

Removes any conflicts between eslint rules and prettier when it comes to formatting rule—> eslit turns of their formatting rules and prettier handles that instead
Removes fighting between ESLint and prettier 

4. Npc tsc -p . —noEmit
 noEmit option tells TypeScript that we only want to run type checking and do not want the compiler to output any transpiled code
