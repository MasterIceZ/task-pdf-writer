import { withAuthUser, useAuthUser, AuthAction } from "next-firebase-auth";
import Head from "next/head";
import styles from "../styles/Login.module.css";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { MoonLoader } from "react-spinners";
export default withAuthUser({
  whenAuthed: AuthAction.REDIRECT_TO_APP,
})(function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const register = () => {
    setIsLoading(true);
    return firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .catch((e) => alert(e.message))
      .finally(() => setIsLoading(false));
  };
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Login</h1>

        <p className={styles.description}>Welcome back!</p>

        <div className={styles.card}>
          <h3 className={styles.inputhead}>Email</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <h3 className={styles.inputhead}>Password</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.button}
            onClick={register}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.spinnerwrapper}>
                <MoonLoader size="15px" color="white" css="display: block" />
              </div>
            ) : (
              <>Register</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
});
