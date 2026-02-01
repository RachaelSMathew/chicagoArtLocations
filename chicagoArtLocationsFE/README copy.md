# stationInformationFE

Summary: Taking location data from [here](https://data.cityofchicago.org/resource/we8h-apcf.json) ([Official website](https://data.cityofchicago.org/Parks-Recreation/Parks-Chicago-Park-District-Artworks-current-/e9ef-hrzb))and finding the nearest art locations to the current coordinate (37°45'15.0"N 122°25'08.8"W). First ten search results should appear, and then when user scrolls to the bottom a loading icon should appear and then more results should come.

## [Trello](https://trello.com/b/xgeGOvOm/kdtreeclosestart)

Deploying the BackEnd:
[Code](https://github.com/RachaelSMathew/stationInformation/blob/main/collectPointsKDTree.py)

[Using Render](https://dashboard.render.com/project/prj-csopq39u0jms738nqoag)

<img width="648" alt="Screenshot 2024-12-29 at 11 15 39 PM" src="https://github.com/user-attachments/assets/f1ba98e7-c240-4a6a-b4f2-5087d7d1fb42" />

IP address 0.0.0.0 is used on servers to designate a service may bind to all network interfaces. It tells a server to "listen" for and **accept connections from any IP address**.

<img width="579" alt="Screenshot 2024-12-25 at 10 25 36 PM" src="https://github.com/user-attachments/assets/418e0d73-4bcb-485e-8630-a2cb9a3cdb02" />
<img width="461" alt="Screenshot 2024-12-29 at 11 22 29 PM" src="https://github.com/user-attachments/assets/fcba8b31-a1eb-4105-800f-395a5484ee19" />
<img width="654" alt="Screenshot 2024-12-25 at 11 05 43 PM" src="https://github.com/user-attachments/assets/fda49be7-0f91-4abe-8cee-db3b213adf14" />

## Issues run into:
1. HTTP 405 Method Not Allowed Error (you send a HTTP request (GET, PUT etc) to server but server doesn't accept method)
      - called render web service [here](https://github.com/RachaelSMathew/stationInformationFE/blob/3fafa88a1234434bb2d2c90123c8d5ff73f12360/src/App.js#L24-L31)
      - GET HTTP request using both terminal with curl<img width="744" alt="Screenshot 2024-12-29 at 6 15 24 PM" src="https://github.com/user-attachments/assets/0f72e488-666b-46e0-b146-9a9fe9ee2f9a" /> and Postman. BOTH WORKED

      - Solution **pre-flight request**: Browser automatically sends an OPTIONS request before the actual HTTP request. This is called the preflight request, and its purpose is to check if the server allows the main request (e.g., POST, PUT) from a different origin.

      The **405 Method Not Allowed error** was happening during **pre-flight request**, server does not allow the OPTIONS method [SOLUTION](https://fastapi.tiangolo.com/tutorial/cors/#use-corsmiddleware)
   
   **Postman** doesn't trigger this preflight request because it's not bound by the same cross-origin restrictions as browsers.

   <img width="705" alt="Screenshot 2024-12-29 at 6 40 17 PM" src="https://github.com/user-attachments/assets/d4ba0630-8958-4961-a330-e9c44bcb0166" />

## Lessons learned 
Cross-origin resource sharing (CORS) is a mechanism to **bypass the same-origin policy** 
      - allows a web page to access restricted resources from a server on a domain different than the domain that served the web page

# \<scheme\>://\<hostname\>\<port\> (http://localhost:3000)

**What makes two different origins?**
Even if scheme and hostname are the same, but the ports are different - they are two different origins.

Adding headers to Axios GET requests 
<img width="470" alt="Screenshot 2024-12-29 at 6 20 49 PM" src="https://github.com/user-attachments/assets/6e4a655f-9f9f-49fb-ab7a-2cf438a346ea" /> 

## Host vs. port
**Host**: computer or device on network, has IP address, has multiple services 
**Port**: address on host that specifies a certain service 

Host is a house and port is a door which leads to a particular room(service)

## IntersectionObserver
  ```
useEffect(() => {
    const observer = new IntersectionObserver( //  it allows us to detect when certain elements are visible in our viewport
      ([entry]) => {
       setPastDivs(!entry.isIntersecting)
      },
      {
        root: null, // Use the viewport as the root
        rootMargin: '0px', // No margin
        threshold: .8
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, []);
```
