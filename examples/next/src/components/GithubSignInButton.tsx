'use client'

export const GithubSignInButton = () => (
  
  <button
    onClick={async () => {
      const signInResponse = await fetch(
        'http://localhost:4000/api/auth/signin/github',
        {
          method: 'POST',
          body: JSON.stringify({ 
            callbackUrl: 'http://localhost:3000'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );
      if (!signInResponse.ok) {
        console.log('Error:');
        console.log(signInResponse.statusText);
        console.log(await signInResponse.json());
      }
      console.log('Success:');
      console.log(await signInResponse.json());
    }}
  >
    Sign in by Github
  </button>
);

