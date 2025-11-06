// src/pages/EmployeeUploads.js
import React, { useState, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsconfig from '../aws-exports';

Amplify.configure(awsconfig);

const PRESIGN_URL = process.env.REACT_APP_PRESIGN_URL;
const META_URL = process.env.REACT_APP_META_URL || '';

function putWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream'
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        if (onProgress) onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

// ==== METADATA CONSTANTS ==== //
const THEME_OPTIONS = [
  'Agriculture & Value chains',
  'Climate change & Adapation',
  'Employment',
  'Food security',
  'Nutrition',
  'Resilience',
  'Rural-urbain',
  'Social protection',
  'Gender',
  'Livestock & Pastoralism',
  'Markets, prices & trade',
  'Rural-urban links',
  'Children & Youth',
  'Water',
  'Environment',
  'Naturel resource management',
  'Health',
  'Covid-19',
  'Fisheries & Aquaculture',
  'Land',
  'SDGs',
];

const LANGUAGE_OPTIONS = ['English', 'French', 'Portuguese'];

const COUNTRY_OPTIONS = [
  'Benin',
  'Burkina Faso',
  'Cabo Verde',
  'Chad',
  'CILSS area',
  "Cote d'lvoire",
  'ECOWAS area',
  'G5 Sahel area',
  'Ghana',
  'Guninea-Bissau',
  'Liberia',
  'Liptako-Gourma',
  'Mali',
  'Mauritania',
  'Niger',
  'Nigeria',
  'Senegal',
  'Sierra Leone',
  'Togo',
  'Cameroon',
  'UEMOA area',
];

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// years 2000 – 2035
const YEAR_OPTIONS = Array.from({ length: 36 }, (_, i) => 2000 + i);

const palette = {
  bgMain: '#fafaf3',
  bgOverlayWatermarkOpacity: 0.05,
  cardBg: 'rgba(255,255,255,0.92)',
  greenMain: '#316c41',
  greenDark: '#1e3a24',
  textDark: '#1e2c20',
  textMid: '#6a7366',
  borderSoft: '#d2d7c8',
  borderCard: '#cfd3c6',
  borderStrong: '#9da99a',
  white: '#ffffff',
  shadowMain:
    '0 28px 60px -20px rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.05)',
  shadowHeader: '0 10px 24px -8px rgba(0,0,0,0.18)',
};

const styles = {
  pageWrapper: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: palette.bgMain,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Inter', 'Roboto', 'Segoe UI', sans-serif",
    color: palette.textDark,
  },
  watermark: {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('/images/swac-oecd.png')",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'contain',
    opacity: palette.bgOverlayWatermarkOpacity,
    pointerEvents: 'none',
  },

  /* HEADER */
  headerBar: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(6px)',
    borderBottom: `1px solid ${palette.borderSoft}`,
    boxShadow: palette.shadowHeader,
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: '12px',
  },
  headerLeftChunk: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: '12px',
  },
  logoBox: {
    flexShrink: 0,
    height: 40,
    width: 40,
    borderRadius: '8px',
    backgroundColor: palette.greenMain + '22',
    border: `1px solid ${palette.greenMain}`,
    color: palette.greenMain,
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.15)',
  },
  productTextWrap: {
    lineHeight: 1.4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: palette.greenMain,
  },
  productSub: {
    fontSize: 11,
    color: palette.textMid,
  },

  headerRightChunk: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: '16px',
    rowGap: '8px',
  },

  userInfoWrap: {
    lineHeight: 1.3,
    textAlign: 'right',
    cursor: 'default',
  },
  userName: {
    fontSize: 13,
    fontWeight: 500,
    color: palette.textDark,
  },
  userMail: {
    fontSize: 11,
    color: palette.textMid,
  },

  avatarCircle: {
    height: 36,
    width: 36,
    borderRadius: '9999px',
    backgroundColor: palette.greenMain,
    border: `1px solid ${palette.greenDark}`,
    color: palette.white,
    fontSize: 11,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3) inset',
  },
  signOutBtn: {
    appearance: 'none',
    backgroundColor: palette.white,
    border: `1px solid ${palette.borderSoft}`,
    borderRadius: '6px',
    fontSize: 12,
    padding: '6px 10px',
    lineHeight: 1.2,
    color: palette.textDark,
    cursor: 'pointer',
  },

  /* MAIN WRAPPER */
  mainOuter: {
    position: 'relative',
    zIndex: 10,
    padding: '32px 24px 64px',
    maxWidth: 1120,
    margin: '0 auto',
  },

  /* CARD */
  card: {
    backgroundColor: palette.cardBg,
    borderRadius: '16px',
    border: `1px solid ${palette.borderCard}`,
    boxShadow: palette.shadowMain,
    padding: '24px',
  },

  cardHeaderRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: '12px',
    marginBottom: '20px',
    alignItems: 'flex-start',
  },

  titleBlock: {
    flex: '1 1 auto',
    minWidth: '260px',
    maxWidth: '700px',
  },
  uploadTitleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '12px',
  },
  uploadTitle: {
    margin: 0,
    color: palette.textDark,
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  minorMeta: {
    fontSize: 11,
    color: palette.textMid,
    lineHeight: 1.3,
    backgroundColor: palette.white,
    border: `1px solid ${palette.borderSoft}`,
    borderRadius: '4px',
    padding: '2px 6px',
    boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
  },
  uploadDesc: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: palette.textMid,
    lineHeight: 1.4,
    maxWidth: 780,
  },

  statusPillWrap: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    minWidth: '160px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    border: `1px solid ${palette.greenMain}`,
    backgroundColor: palette.greenMain + '22',
    color: palette.greenDark,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.2,
    padding: '8px 12px',
  },
  statusDot: {
    height: 8,
    width: 8,
    borderRadius: '9999px',
    backgroundColor: palette.greenMain,
    boxShadow: `0 0 4px 1px ${palette.greenMain}88`,
  },

  /* DROPZONE */
  dropOuter: {
    borderTop: `1px dashed ${palette.borderCard}`,
    paddingTop: '20px',
  },
  dropFrame: {
    border: `2px dashed ${palette.borderCard}`,
    borderRadius: '12px',
    backgroundColor: palette.white,
    padding: '32px 16px',
    textAlign: 'center',
    transition: 'background-color .15s, box-shadow .15s',
    boxShadow:
      'inset 0 0 0 9999px rgba(49,108,65,0)', // default no tint
  },
  dropFrameHover: {
    boxShadow:
      'inset 0 0 0 9999px rgba(49,108,65,0.03), 0 4px 14px rgba(0,0,0,0.07)',
  },
  dzTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: palette.greenMain,
    marginBottom: 8,
  },
  dzOr: {
    fontSize: 13,
    color: palette.textMid,
    marginBottom: 16,
  },
  chooseBtn: {
    backgroundColor: palette.greenMain,
    border: `1px solid ${palette.greenDark}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
    borderRadius: '8px',
    color: palette.white,
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 16px',
    cursor: 'pointer',
    lineHeight: 1.2,
    minWidth: 140,
  },

  /* SELECTED FILE CARD */
  fileWrapper: {
    marginTop: 24,
    backgroundColor: palette.white,
    border: `1px solid ${palette.borderSoft}`,
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '16px 20px',
  },
  fileHeaderRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: '6px',
  },
  fileHeaderLeft: {
    minWidth: '200px',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: palette.greenMain,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 500,
    color: palette.textDark,
    marginBottom: 2,
    wordBreak: 'break-word',
    lineHeight: 1.3,
  },
  fileMeta: {
    fontSize: 12,
    color: palette.textMid,
    marginBottom: 12,
    lineHeight: 1.3,
  },

  resultBadge: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '6px',
    fontSize: 12,
    lineHeight: 1.2,
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
  },
  resultOK: {
    color: palette.greenDark,
    backgroundColor: palette.greenMain + '22',
    border: `1px solid ${palette.greenMain}`,
  },
  resultERR: {
    color: '#7f1d1d',
    backgroundColor: '#fee2e2',
    border: '1px solid #dc2626',
  },

  progressOuter: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e8e7dc',
    overflow: 'hidden',
    marginBottom: 12,
    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.12)',
  },
  progressInnerBase: {
    height: '100%',
    backgroundColor: palette.greenMain,
    transition: 'width .15s linear',
  },

  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: '8px',
    columnGap: '12px',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: palette.greenMain,
    border: `1px solid ${palette.greenDark}`,
    borderRadius: '8px',
    color: palette.white,
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 16px',
    cursor: 'pointer',
    lineHeight: 1.2,
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  secondaryBtn: {
    backgroundColor: palette.white,
    border: `1px solid ${palette.greenDark}`,
    borderRadius: '8px',
    color: palette.textDark,
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 16px',
    cursor: 'pointer',
    lineHeight: 1.2,
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  tinyBtn: {
    backgroundColor: palette.white,
    border: `1px solid ${palette.borderSoft}`,
    borderRadius: '6px',
    color: palette.textDark,
    fontSize: 12,
    fontWeight: 500,
    padding: '6px 10px',
    cursor: 'pointer',
    lineHeight: 1.2,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },

  keyBlock: {
    fontSize: 12,
    color: palette.textMid,
    wordBreak: 'break-all',
    lineHeight: 1.4,
  },
  keyLabel: {
    fontWeight: 600,
    color: palette.textDark,
    marginRight: 4,
    fontSize: 12,
    lineHeight: 1.4,
  },
  keyMono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.4,
  },

  // Metadata form styles
  metaSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: `1px dashed ${palette.borderCard}`,
  },
  metaCard: {
    marginTop: 12,
    backgroundColor: '#f8fbf9',
    borderRadius: 10,
    border: `1px solid ${palette.borderSoft}`,
    padding: 16,
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: palette.greenDark,
    marginBottom: 8,
  },
  metaHelp: {
    fontSize: 12,
    color: palette.textMid,
    marginBottom: 12,
  },
  metaField: {
    marginBottom: 10,
  },
  metaLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: palette.textDark,
    marginBottom: 4,
  },
  metaInput: {
    width: '100%',
    borderRadius: 6,
    border: `1px solid ${palette.borderSoft}`,
    padding: '6px 8px',
    fontSize: 12,
  },
  metaTextarea: {
    width: '100%',
    minHeight: 60,
    borderRadius: 6,
    border: `1px solid ${palette.borderSoft}`,
    padding: '6px 8px',
    fontSize: 12,
  },
  metaCheckboxList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 4,
    marginTop: 4,
  },
  metaCheckboxItem: {
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  metaJsonBox: {
    marginTop: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    border: `1px solid ${palette.borderSoft}`,
    padding: 8,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 11,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: 240,
    overflow: 'auto',
  },
};

export default function EmployeeUploadsPage() {
  return (
    <Authenticator
      loginMechanisms={['email']}
      formFields={{
        signIn: {
          username: {
            label: 'Email',
            placeholder: 'Enter your email',
            type: 'email',
            autocomplete: 'email',
          },
          password: {
            label: 'Password',
            placeholder: 'Enter your password',
          },
        },
        signUp: {
          email: { label: 'Email', placeholder: 'Enter your email' },
          password: { label: 'Password' },
          confirm_password: { label: 'Confirm password' },
        },
      }}
    >
      {({ signOut, user }) => {
        const displayName =
          user?.attributes?.name || user?.username || 'Employee User';
        const displayMail =
          user?.attributes?.email || 'employee@example.com';

        const initials = displayName
          .split(' ')
          .map((w) => w[0]?.toUpperCase?.() || '')
          .slice(0, 2)
          .join('');

        return (
          <div style={styles.pageWrapper}>
            <div style={styles.watermark} />

            {/* HEADER */}
            <header style={styles.headerBar}>
              <div style={styles.headerLeftChunk}>
                <div style={styles.logoBox}>SW</div>
                <div style={styles.productTextWrap}>
                  <div style={styles.productTitle}>Secure Workspace</div>
                  <div style={styles.productSub}>
                    Internal Document Portal
                  </div>
                </div>
              </div>

              <div style={styles.headerRightChunk}>
                <div style={styles.userInfoWrap}>
                  <div style={styles.userName}>{displayName}</div>
                  <div style={styles.userMail}>{displayMail}</div>
                </div>
                <div style={styles.avatarCircle}>{initials || 'E'}</div>
                <button
                  style={styles.signOutBtn}
                  onClick={() => {
                    if (typeof signOut === 'function') signOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            </header>

            {/* MAIN */}
            <main style={styles.mainOuter}>
              <Uploader />
            </main>
          </div>
        );
      }}
    </Authenticator>
  );
}

function Uploader() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadedKey, setUploadedKey] = useState(null);
  const [dropHover, setDropHover] = useState(false);
  const inputRef = useRef(null);

  const ACCEPT = '.pdf,.png,.jpg,.jpeg';

  function onPick() {
    inputRef.current?.click();
  }

  function onChoose(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus('idle');
      setMessage('');
      setProgress(0);
      setUploadedKey(null);
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    setDropHover(true);
  }

  function onDragLeave() {
    setDropHover(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDropHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setStatus('idle');
      setMessage('');
      setProgress(0);
      setUploadedKey(null);
    }
  }

  async function uploadToS3() {
    if (!file) return;

    if (!PRESIGN_URL) {
      setStatus('error');
      setMessage('Missing REACT_APP_PRESIGN_URL');
      return;
    }

    setStatus('uploading');
    setMessage('');

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileType = file.type || 'application/octet-stream';

      const res = await fetch(PRESIGN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileType,
        }),
      });

      if (!res.ok) throw new Error('Failed to get presigned URL');

      let data = await res.json();

      if (data && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
        } catch {
          /* ignore */
        }
      }

      const putUrl = data.uploadURL || data.url;
      const objectKey = data.key || fileName;

      if (!putUrl) {
        throw new Error('Lambda did not return uploadURL');
      }

      await putWithProgress(putUrl, file, (pct) => setProgress(pct));

      setUploadedKey(objectKey);
      setStatus('success');
      setMessage('File uploaded successfully.');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Upload failed.');
    }
  }

  function copyKey() {
    if (!uploadedKey) return;
    navigator.clipboard
      ?.writeText(uploadedKey)
      .then(() => {
        setMessage('Key copied to clipboard.');
        setStatus('success');
      })
      .catch(() => {
        setMessage('Could not copy key.');
        setStatus('error');
      });
  }

  function resetAll() {
    setFile(null);
    setStatus('idle');
    setMessage('');
    setProgress(0);
    setUploadedKey(null);
  }

  return (
    <section style={styles.card}>
      {/* Header row: title, meta, connected pill */}
      <div style={styles.cardHeaderRow}>
        <div style={styles.titleBlock}>
          <div style={styles.uploadTitleRow}>
            <h1 style={styles.uploadTitle}>Secure Document Upload</h1>

            {/* small metadata badges */}
            <span style={styles.minorMeta}>Max file size: 10 MB</span>
            <span style={styles.minorMeta}>
              Last upload:{' '}
              {status === 'success' && uploadedKey ? 'just now' : '—'}
            </span>
          </div>

          <p style={styles.uploadDesc}>
            Please upload only required internal documents (PDF / images).
            Uploaded files are stored securely and are only available to
            authorized staff.
          </p>
        </div>

        <div style={styles.statusPillWrap}>
          <div style={styles.statusPill} title="Connection status">
            <div style={styles.statusDot} />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div style={styles.dropOuter}>
        <div
          style={{
            ...styles.dropFrame,
            ...(dropHover ? styles.dropFrameHover : {}),
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div style={styles.dzTitle}>Drag &amp; drop your file here</div>
          <div style={styles.dzOr}>or</div>

          <button type="button" style={styles.chooseBtn} onClick={onPick}>
            Choose a file
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            style={{ display: 'none' }}
            onChange={onChoose}
          />
        </div>
      </div>

      {/* Selected file card */}
      {file && (
        <>
          <div style={styles.fileWrapper}>
            <div style={styles.fileHeaderRow}>
              <div style={styles.fileHeaderLeft}>
                <div style={styles.smallLabel}>Selected file</div>

                <div style={styles.fileName}>{file.name}</div>

                <div style={styles.fileMeta}>
                  {file.type || 'Unknown'} •{' '}
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>

              {/* result badge right */}
              <div style={{ minWidth: 120, textAlign: 'right' }}>
                {status === 'success' && (
                  <div
                    style={{
                      ...styles.resultBadge,
                      ...styles.resultOK,
                    }}
                  >
                    <span>✓</span>
                    <span>Uploaded</span>
                  </div>
                )}
                {status === 'error' && (
                  <div
                    style={{
                      ...styles.resultBadge,
                      ...styles.resultERR,
                    }}
                  >
                    <span>⚠</span>
                    <span>Error</span>
                  </div>
                )}
                {status === 'uploading' && (
                  <div
                    style={{
                      ...styles.resultBadge,
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fdba74',
                      color: '#78350f',
                    }}
                  >
                    <span>⟳</span>
                    <span>Uploading...</span>
                  </div>
                )}
                {status === 'idle' && (
                  <div
                    style={{
                      ...styles.resultBadge,
                      backgroundColor: '#f9fafb',
                      border: `1px solid ${palette.borderSoft}`,
                      color: palette.textMid,
                    }}
                  >
                    <span>…</span>
                    <span>Pending</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {status === 'uploading' && (
              <div style={styles.progressOuter}>
                <div
                  style={{
                    ...styles.progressInnerBase,
                    width: `${progress}%`,
                  }}
                />
              </div>
            )}

            {/* Buttons */}
            <div style={styles.buttonRow}>
              <button
                onClick={uploadToS3}
                disabled={status === 'uploading'}
                style={{
                  ...styles.primaryBtn,
                  ...(status === 'uploading'
                    ? styles.primaryBtnDisabled
                    : {}),
                }}
              >
                {status === 'uploading'
                  ? `Uploading... ${progress}%`
                  : 'Upload'}
              </button>

              <button
                onClick={resetAll}
                disabled={status === 'uploading'}
                style={styles.secondaryBtn}
              >
                Remove
              </button>

              {uploadedKey && status === 'success' && (
                <button onClick={copyKey} style={styles.tinyBtn}>
                  Copy key
                </button>
              )}
            </div>

            {/* Status message / key */}
            {message && (
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  marginBottom: 8,
                  color:
                    status === 'error' ? '#b91c1c' : palette.greenMain,
                }}
              >
                {message}
              </div>
            )}

            {uploadedKey && (
              <div style={styles.keyBlock}>
                <span style={styles.keyLabel}>Key:</span>
                <span style={styles.keyMono}>{uploadedKey}</span>
              </div>
            )}
          </div>

          {/* Metadata form after successful upload */}
          {uploadedKey && status === 'success' && (
            <div style={styles.metaSection}>
              <MetadataForm uploadedKey={uploadedKey} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ===== Metadata form component =====
function MetadataForm({ uploadedKey }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // datecontent parts (month/year) – user defined
  const now = new Date();
  const [dateMonth, setDateMonth] = useState(
    MONTH_LABELS[now.getMonth()]
  );
  const [dateYear, setDateYear] = useState(String(now.getFullYear()));

  // published date (auto, from upload time)
  const [published] = useState(() => {
    return `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  });

  const [countries, setCountries] = useState([]);
  const [themes, setThemes] = useState([]);
  const [langs, setLangs] = useState([]);
  const [scale, setScale] = useState('Regional (West Africa)');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('idle'); // 'idle' | 'ok' | 'err'
  const [previewJson, setPreviewJson] = useState(null);

  function toggleInArray(current, value) {
    if (current.includes(value)) {
      return current.filter((v) => v !== value);
    }
    return [...current, value];
  }

  function slugify(str) {
    return (str || 'document')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setMsgType('idle');
  
    if (!title || !description || !dateMonth || !dateYear) {
      setMsg('Please fill all required fields.');
      setMsgType('err');
      return;
    }
    if (!countries.length || !themes.length || !langs.length) {
      setMsg(
        'Please select at least one Country, one Theme and one Language.'
      );
      setMsgType('err');
      return;
    }
  
    const monthYear = `${dateMonth} ${dateYear}`;
    const slug = slugify(title);
  
    
    const monthIndex = MONTH_LABELS.indexOf(dateMonth); // 0–11
    const monthFolder = String(monthIndex + 1).padStart(2, '0');
  
    
    const baseName = uploadedKey.split('/').pop() || uploadedKey;
  
   
    const targetKey = `uploads/${dateYear}/${monthFolder}/${baseName}`;
  
    
    const imgKey = targetKey.replace(/\.pdf$/i, '.png');
  
    
    const payload = {
      title,
      img: `/${imgKey}`,
      flag: '/images/EN_Co-fundedbytheEU_RGB_POS.png',
      datecontent: monthYear,
      bllink: `/documents/${slug}`,
      content: {
        Published: published,
        Description: description,
        Countries: countries.join(', '),
        Themes: themes.join(', '),
        Scale: scale,
        Langs: langs.join(', '),
      },
      permalink: `/${targetKey}`,
  
      
      sourceKey: uploadedKey,  
      targetKey,              
    };
  
    
    setPreviewJson(payload);
  
    if (!META_URL) {
      setMsg(
        'Metadata JSON has been generated below. Because REACT_APP_META_URL is not defined, no backend request was sent.'
      );
      setMsgType('ok');
      return;
    }
  
    try {
      setSaving(true);
      const res = await fetch(META_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        throw new Error(`Metadata API returned ${res.status}`);
      }
  
      setMsg('Metadata saved successfully.');
      setMsgType('ok');
    } catch (err) {
      console.error(err);
      setMsg(err.message || 'Failed to save metadata.');
      setMsgType('err');
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div style={styles.metaCard}>
      <h2 style={styles.metaTitle}>Document metadata</h2>
      <p style={styles.metaHelp}>
        Please fill the fields below. All fields are required. This will be
        stored into <code>DocumentsRPCA.json</code> (or an equivalent CMS JSON
        file).
      </p>

      <form onSubmit={onSubmit}>
        <div style={styles.metaField}>
          <label style={styles.metaLabel}>Title</label>
          <input
            style={styles.metaInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>Description</label>
          <textarea
            style={styles.metaTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>
            Display date (month / year) – used as <code>datecontent</code>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={styles.metaInput}
              value={dateMonth}
              onChange={(e) => setDateMonth(e.target.value)}
            >
              {MONTH_LABELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              style={styles.metaInput}
              value={dateYear}
              onChange={(e) => setDateYear(e.target.value)}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>
            Published (auto from upload time)
          </label>
          <input style={styles.metaInput} value={published} readOnly />
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>Countries</label>
          <div style={styles.metaCheckboxList}>
            {COUNTRY_OPTIONS.map((c) => (
              <label key={c} style={styles.metaCheckboxItem}>
                <input
                  type="checkbox"
                  checked={countries.includes(c)}
                  onChange={() =>
                    setCountries((curr) => toggleInArray(curr, c))
                  }
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
          <small style={styles.metaHelp}>
            You can select as many countries as needed.
          </small>
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>Themes</label>
          <div style={styles.metaCheckboxList}>
            {THEME_OPTIONS.map((t) => (
              <label key={t} style={styles.metaCheckboxItem}>
                <input
                  type="checkbox"
                  checked={themes.includes(t)}
                  onChange={() =>
                    setThemes((curr) => toggleInArray(curr, t))
                  }
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>Languages</label>
          <div style={styles.metaCheckboxList}>
            {LANGUAGE_OPTIONS.map((l) => (
              <label key={l} style={styles.metaCheckboxItem}>
                <input
                  type="checkbox"
                  checked={langs.includes(l)}
                  onChange={() =>
                    setLangs((curr) => toggleInArray(curr, l))
                  }
                />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={styles.metaField}>
          <label style={styles.metaLabel}>Scale</label>
          <input
            style={styles.metaInput}
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            ...styles.primaryBtn,
            ...(saving ? styles.primaryBtnDisabled : {}),
            marginTop: 4,
          }}
        >
          {saving ? 'Saving metadata…' : 'Save metadata'}
        </button>
      </form>

      {msg && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color:
              msgType === 'err' ? '#b91c1c' : palette.greenMain,
          }}
        >
          {msg}
        </div>
      )}

      {previewJson && (
        <div style={styles.metaJsonBox}>
          {JSON.stringify(previewJson, null, 2)}
        </div>
      )}
    </div>
  );
}
