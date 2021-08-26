import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect, useRef } from 'react';
import Loader from "react-loader-spinner";
import { io } from 'socket.io-client'

const PROGRESS = {
  NOT_LOGGED_IN: "not logged in",
  LOGGED_IN: "connected to your google drive",
  LOADING_TORRENT: "loading the torrent...",
  DOWNLOADING_TORRENT: "downloading the torrent...",
  DOWNLOAD_COMPLETE: "Download completed"
}

function ErrorPrompt({ errMsg, setError }) {
  return (
    <div className={styles.error}>
      <button
        onClick={() => setError(undefined)}>
        Close
      </button>
      <div style={{ overflowY: "auto" }}>
        <p>{errMsg}</p>
      </div>
    </div>
  )
}

function TwoStepAuthPrompt({text, set2StepAuth, conn}){
  return (
    <div className={styles.authPrompt}>
      <button
        onClick={() => {
          conn.emit('2stepAuth')
          set2StepAuth(undefined)
        }}>
        Done
      </button>
      <div style={{ overflowY: "auto" }}>
        <p>{text}</p>
      </div>
    </div>
  )
}

function MagentUriForm({ setProgress, conn }) {
  const magnet = useRef(null)
  return (
    <div className={styles.inner}>
      <h1>Enter Magnet Link</h1>
      <hr className={styles.pillLine} />
      <input style={{ marginBottom: "1rem" }} className={styles.creds} type="textarea" placeholder="Magnet URI" ref={magnet} /><br />
      <a
        className={styles.link}
        href="https://nutbread.github.io/t2m/"
        rel="noreferrer"
        target="_blank">
        have torrent file?
      </a><br />
      <button
        className={styles.btn}
        onClick={() => {
          console.log(magnet?.current?.value)
          conn?.emit('magnet', magnet?.current?.value)
          setProgress(PROGRESS.LOADING_TORRENT)
        }}>
        Download to Drive
      </button>
    </div>
  )
}

function Progress({ setProgress, text }) {
  return (
    <div className={styles.inner}>
      <Loader
        type="Rings" // Bars Grid Oval
        color="#FFF"
        height={100}
        width={100}
      />
      <p className={styles.animatedText}>{text}<br />We are doing a lot of stuff under the hood, be patient.</p>
    </div>
  )
}

function SignIn({ setProgress, conn }) {
  const [gmail, pass] = [useRef(null), useRef(null)]
  return (
    <div className={styles.inner}>
      <h1>Sign in</h1>
      <p style={{margin: "0.1rem 0"}}>with your Google account</p>
      <hr className={styles.pillLine} />
      <input className={styles.creds} type="email" placeholder="Gmail ID" ref={gmail} /><br />
      <input className={styles.creds} type="password" placeholder="Password" ref={pass} /><br />
      <a
        style={{ float: "left" }}
        className={styles.link}
        href="https://accounts.google.com/signup"
        rel="noreferrer"
        target="_blank">
        Create Account
      </a>
      <button
        style={{ float: "right" }}
        className={styles.btn}
        onClick={() => {
          conn?.emit('start', { gmail: gmail?.current?.value, pass: pass?.current?.value })
          setProgress(PROGRESS.LOADING)
        }}>
        Sign in
      </button>
      <div style={{textAlign: "left", fontSize: "12px", padding:"3rem 0"}}>
      <p>NOTE :</p>
      <p>{`1. Don't close the tab untill download Finishes`}</p>
      <p>{`2. I don't store your passwords, but its recommended to create a temporary google account and use it here`}</p>
      <p>{`3. This web app is under development, and my algorithm can break anytime. If google changes something, but i will keep giving support`}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [progress, setProgress] = useState(PROGRESS.NOT_LOGGED_IN);
  const [conn, setConn] = useState(undefined);
  const [message, setMessage] = useState(undefined)
  const progressBar = useRef(null)
  const [downloadStatus, setDownloadStatus] = useState(undefined)
  const [error, setError] = useState(undefined)
  const [_2stepAuth, set2StepAuth] = useState(undefined)

  useEffect(() => {
    if (conn) {
      conn.on('message', data => {
        setMessage(data)
        console.log(data)
      })
      conn.on('stateChange', data => {
        setProgress(data)
      })
      conn.on('2stepAuth', set2StepAuth)
      conn.on('err', data => {
        console.log(data)
        setProgress(PROGRESS.NOT_LOGGED_IN)
        setError(data)
      })
      conn.on('downloadDetails', data => {
        console.log(data)
        setDownloadStatus(data)
      })
    }
  }, [conn])

  useEffect(() => {
    setConn(io('wss://t2gd-prod.herokuapp.com'))
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 style={{ margin: "10px" }}>Torrent To Google Drive</h2>
      </div>
      <Head>
        <title>Create Next App</title>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests"/>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {
        error &&
        <ErrorPrompt errMsg={error} setError={setError} />
      }
      {
        _2stepAuth &&
        <TwoStepAuthPrompt text={_2stepAuth} set2StepAuth={set2StepAuth} conn={conn}/>
      }
      <div className={styles.main}>
        {
          {
            [PROGRESS.NOT_LOGGED_IN]: <SignIn setProgress={setProgress} conn={conn} />,
            [PROGRESS.DOWNLOAD_COMPLETE]: <SignIn setProgress={setProgress} conn={conn} />,
            [PROGRESS.LOADING]: <Progress setProgress={setProgress} text={message} />,
            [PROGRESS.LOADING_TORRENT]: <Progress setProgress={setProgress} text={message} />,
            [PROGRESS.LOGGED_IN]: <MagentUriForm setProgress={setProgress} conn={conn} />
          }[progress]
        }
      </div>
      <div className={styles.downloads}>
        <h2>Downloads</h2>
        <hr className={styles.pillLine} />
        {
          (downloadStatus) &&
          (
            progress === PROGRESS.DOWNLOAD_COMPLETE ?
              <div className={styles.downloadItem}>
                <p>{downloadStatus.split('||||')[0]}</p>
                <p>Download Completed</p>
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: "100%" }} ref={progressBar}></div>
                </div>
                <div>
                  <span style={{ float: "right", marginTop: "0.5rem" }}>{`100 %`}</span>
                </div>
              </div>
              :
              <div className={styles.downloadItem}>
                <p>{downloadStatus.split('||||')[0]}</p>
                <p>{downloadStatus.split('||||')[2]}</p>
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: `${downloadStatus.split('||||')[3].trim()}%` }} ref={progressBar}></div>
                </div>
                <div>
                  <span style={{ float: "left", marginTop: "0.5rem" }}> {downloadStatus.split('||||')[1]}</span> <span style={{ float: "right", marginTop: "0.5rem" }}>{`${downloadStatus.split('||||')[3]} %`}</span>
                </div>
              </div>
          )
        }
      </div>
    </div>
  )
}
