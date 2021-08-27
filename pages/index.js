import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect, useRef } from 'react';
import Loader from "react-loader-spinner";
import { io } from 'socket.io-client'
import axios from 'axios'

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

function TwoStepAuthPrompt({ text, set2StepAuth, conn }) {
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

function SearchItem({ torrent, conn, setProgress, setSearcher, setError }) {
  const handleClick = async _ => {
    setProgress(PROGRESS.LOADING_TORRENT)
    setSearcher(false)
    if (torrent.magnet) {
      conn.emit('magnet', torrent.magnet)
    } else {
      try {
        const { data, status } = await axios.post('/api/magnet', { 'torrent': torrent })
        conn.emit('magnet', data)
      } catch (e) {
        setError("cannot get the magnet uri " + e.message)
        setProgress(PROGRESS.LOGGED_IN)
        setSearcher(true)
      }
    }
  }
  return (
    <div className={styles.downloadItem} style={{ width: "100%" }}>
      <p>{torrent?.title}</p>
      <div>
        <span style={{ float: "left", marginTop: "0.5rem" }}>{`size :${torrent.size}`}</span>
        <button
          className={styles.btn}
          onClick={handleClick}
          style={{ margin: "0.25rem 0 0", float: "right" }}>
          Download
        </button>
      </div>
    </div>
  )
}

function TorrentSearcher({ setSearcher, conn, setProgress, setError }) {
  const [results, setResults] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [noresults, setNoresults] = useState(false)
  const inputRef = useRef(null)

  const submitHandler = _ => {
    (async () => {
      setLoading(true)
      console.log(inputRef?.current?.value)
      const { data } = await axios.get(`api/search/${inputRef.current.value}`).catch(err => console.log)
      console.log(data)
      if (data.length === 0) {
        setLoading(false)
        setNoresults(true)
        return;
      }
      setResults(data)
      setLoading(false)
    })()
  }

  return (
    <div className={styles.torrentSearcher}>
      <button
        className={styles.btn}
        style={{ position: 'absolute', top: "10px", right: "15px", fontSize: "10px", margin: "0" }}
        onClick={() => setSearcher(false)}>
        Close
      </button>
      <h1 style={{ margin: "1.5rem 0 0.5rem" }}>Search Torrents</h1>
      <hr className={styles.pillLine} style={{ backgroundColor: "#0056a1", margin: "0 auto" }} />
      <form onSubmit={e => {
        e.preventDefault()
        submitHandler()
      }
      }>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", margin: "0 1rem" }}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Query"
            ref={inputRef} />
          <button
            className={styles.btn}
            style={{ margin: "1rem 1rem 0" }}
            type="submit">
            Search
          </button>
        </div>
      </form>
      {
        loading &&
        <div style={{ margin: "1rem" }}>
          <Loader
            type="Bars" // Bars Grid Oval
            color="#0056a1"
            height={100}
            width={100}
          />
          <p>I know i am bit slow 🥲<br /> still trying my best...</p>
        </div>
      }
      {
        (!loading && results) &&
        <div className={styles.resultsDiv}>
          {results.map((result, idx) =>
            <SearchItem torrent={result} conn={conn} setProgress={setProgress} key={idx} setSearcher={setSearcher} setError={setError} />
          )}
        </div>
      }

      {
        noresults &&
        <p className={styles.noRes}>No results found for {inputRef?.current?.value}</p>
      }

    </div>
  )
}

function MagentUriForm({ setProgress, conn, setSearcher }) {
  const magnet = useRef(null)
  return (
    <div className={styles.inner}>
      <h1>Enter Magnet Link</h1>
      <hr className={styles.pillLine} />
      <input style={{ marginBottom: "1rem" }} className={styles.creds} type="text" placeholder="Magnet URI" ref={magnet} /><br />
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
      <h2 style={{ margin: "0.35rem" }}> - OR - </h2>
      <button
        style={{ margin: "0.25rem 1rem 2rem" }}
        className={styles.btn}
        onClick={() => {
          setSearcher(true)
        }}>
        Search torrents (NEW)
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
      <p style={{ margin: "0.1rem 0" }}>with your Google account</p>
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
      <div style={{ textAlign: "left", fontSize: "12px", padding: "3rem 0" }}>
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
  const [searcher, setSearcher] = useState(false)

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
        <title>Torrent To Google Drive</title>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <meta name="description" content="Download torrent files directly to your google drive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {
        error &&
        <ErrorPrompt errMsg={error} setError={setError} />
      }
      {
        _2stepAuth &&
        <TwoStepAuthPrompt text={_2stepAuth} set2StepAuth={set2StepAuth} conn={conn} />
      }
      <div className={styles.main}>
        {
          {
            [PROGRESS.NOT_LOGGED_IN]: <SignIn setProgress={setProgress} conn={conn} />,
            [PROGRESS.DOWNLOAD_COMPLETE]: <SignIn setProgress={setProgress} conn={conn} />,
            [PROGRESS.LOADING]: <Progress setProgress={setProgress} text={message} />,
            [PROGRESS.LOADING_TORRENT]: <Progress setProgress={setProgress} text={message} />,
            [PROGRESS.LOGGED_IN]: <MagentUriForm setProgress={setProgress} conn={conn} setSearcher={setSearcher} />
          }[progress]
        }
        <p
          style={{ position: "absolute", bottom: "0px", right: "20px", color: "white", fontSize: "10px" }}>
          {`Made with ❣️ by Harsh suthar   .`}
          <a
            style={{ color: "#0006a1", fontSize: "12px", textDecoration: "underline" }}
            href="https://www.instagram.com/notreallyhaarsh/" rel="noreferrer" target="_blank">
            Know me!
          </a>
        </p>
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
      {searcher && <TorrentSearcher setSearcher={setSearcher} conn={conn} setProgress={setProgress} setError={setError} />}
    </div>
  )
}
