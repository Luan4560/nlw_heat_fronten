import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from '../service/api'

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

type IAuthProvider = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: IAuthProvider) {
  const [user, setUser] = useState<User | null>(null)
  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=ee5bef8b6a2bd9b18f02`

  async function signIn(githubWithCode: string) {
   const response =  await api.post<AuthResponse>('/authenticate', {
      code: githubWithCode,
    })

    const {token, user} = response.data;

    localStorage.setItem('@dowhile:token', token)

    api.defaults.headers.common.authorization = `Bearer ${token}`

    setUser(user)
  }

  async function signOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token')
  }
  
  useEffect(() => {
    const url = window.location.href
    const hasGithubCode = url.includes('?code=');

    if(hasGithubCode) {
      const [urlWithoutCode, githubWithCode] = url.split('?code=')

      window.history.pushState({}, '', urlWithoutCode)

      signIn(githubWithCode)
    }

  }, [])


  useEffect(() => {
    const getToken = async() => {
      const token = localStorage.getItem('@dowhile:token')
  
      if(token) {        
        api.defaults.headers.common.authorization = `Bearer ${token}`

        const response = await api.get<User>('profile')
        setUser(response.data)
      }
    }
    getToken()
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  )
} 