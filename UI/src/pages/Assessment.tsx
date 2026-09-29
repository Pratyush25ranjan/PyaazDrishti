import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Camera, Check, CircleCheck, ImagePlus, Info, Loader2, RefreshCw, ScanLine, Trash2, Upload, X, Weight, Ruler } from 'lucide-react';
import { usePortal } from '../lib/context';
import { ASSETS, CENTERS, DEFAULT_QUALITY, MODEL_VERSION, defaultMultimodal, gradeBatch, makeDetections, makeSizeDistribution, makeVerificationId, withDefaults } from '../lib/data';
import type { Batch, MultimodalState } from '../lib/data';
import { GradingExplanation, Notice, PageHeading, QualitySummary } from '../components/Common';

const processingSteps = ['Analyzing Image', 'Detecting Onions', 'Checking Defects', 'Estimating Size', 'Calculating Grade'];

function prepareImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { reject(new Error('Please choose a JPG, PNG or WebP image.')); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error('This file is larger than 10 MB. Please select a smaller image.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This image could not be read. Please select another file.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('This image is not valid or could not be opened. Please try another image.'));
      image.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) { reject(new Error('Image processing is unavailable in this browser.')); return; }
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function CameraDialog({ onClose, onCapture, onUpload }: { onClose: () => void; onCapture: (file: File) => void; onUpload: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const { t } = usePortal();
  useEffect(() => {
    dialog.current?.showModal();
    let stream: MediaStream | undefined;
    let disposed = false;
    const open = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires a secure browser connection. You can upload an image instead.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
        if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
        if (video.current) video.current.srcObject = stream;
      } catch (cause) {
        if (!disposed) setError(cause instanceof DOMException ? 'Camera access was denied or no camera was found. Allow camera access in your browser, or upload an image.' : cause instanceof Error ? cause.message : 'The camera could not be opened.');
      }
    };
    void open();
    return () => { disposed = true; stream?.getTracks().forEach((track) => track.stop()); };
  }, []);
  const capture = () => {
    if (!video.current || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    canvas.getContext('2d')?.drawImage(video.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) { onCapture(new File([blob], `onion-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })); onClose(); }
      else setError('The image could not be captured. Please try again.');
    }, 'image/jpeg', 0.9);
  };
  return <dialog className="camera-dialog" ref={dialog} onClose={onClose} aria-labelledby="camera-title"><div className="dialog-heading"><h2 id="camera-title">{t('Capture Image')}</h2><button className="icon-button" onClick={onClose} aria-label="Close camera"><X size={22} /></button></div><p>Keep the onion sample in view, evenly lit and in focus.</p>{error ? <Notice warning>{error}</Notice> : <div className="camera-preview"><video ref={video} autoPlay muted playsInline onCanPlay={() => setReady(true)} />{!ready && <div className="camera-loading"><Loader2 className="spin" size={25} /><span>Opening camera...</span></div>}</div>}<div className="camera-actions"><button className="button button-secondary" onClick={() => { dialog.current?.close(); onClose(); onUpload(); }}><Upload size={16} />{t('Upload Image')}</button><button className="button button-primary" onClick={capture} disabled={!ready || Boolean(error)}><Camera size={17} />{t('Capture Image')}</button></div><p className="small-muted">The camera is used only for this capture. Images stay on this device.</p></dialog>;
}

export default function Assessment() {
  const { records, saveBatch, t, user, policy, online } = usePortal();
  const [image, setImage] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [fileName, setFileName] = useState('');
  const [imageSource, setImageSource] = useState<'upload' | 'camera' | 'sample' | ''>('');
  const [center, setCenter] = useState(CENTERS[0]);
  const [sampleSize, setSampleSize] = useState(100);
  const [officerName, setOfficerName] = useState(user?.name || '');
  const [officerId, setOfficerId] = useState(user?.id || '');
  const [location, setLocation] = useState(CENTERS[0]);
  const [multimodal, setMultimodal] = useState<MultimodalState>(defaultMultimodal());
  const [result, setResult] = useState<Batch | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileRequest = useRef(0);
  useEffect(() => { if (user) { setOfficerName(user.name); setOfficerId(user.id); } }, [user]);
  const nextId = useMemo(() => {
    const serial = Math.max(128, ...records.map((batch) => Number(batch.id.split('-').pop()) || 0)) + 1;
    return `ON-${new Date().getFullYear()}-${String(serial).padStart(4, '0')}`;
  }, [records]);
  useEffect(() => () => { if (timer.current !== null) window.clearInterval(timer.current); fileRequest.current += 1; }, []);
  const loadFile = async (file?: File, source: 'upload' | 'camera' = 'upload') => {
    if (!file || processing) return;
    const request = ++fileRequest.current;
    setLoadingImage(true); setError('');
    try {
      const prepared = await prepareImage(file);
      if (request !== fileRequest.current) return;
      setImageReady(true); setImage(prepared); setFileName(file.name); setImageSource(source); setResult(null);
    } catch (cause) { if (request === fileRequest.current) setError(cause instanceof Error ? cause.message : 'The image could not be loaded.'); }
    finally { if (request === fileRequest.current) setLoadingImage(false); }
  };
  const start = () => {
    if (!image || !imageReady || processing || loadingImage || result) return;
    setProcessing(true); setStep(0); setError('');
    let completed = 0;
    const quality = { ...DEFAULT_QUALITY };
    const graded = gradeBatch(quality, policy);
    const id = nextId;
    const batch: Batch = withDefaults({ id, reportId: id.replace('ON-', 'QA-'), date: new Date().toISOString(), center, sampleSize, quality, image, fileName, source: 'assessment', officerName: officerName.trim() || 'Demo Officer', officerId: officerId.trim() || 'OFF-DEMO-01', location: location || center, ruleVersion: policy.version, modelVersion: MODEL_VERSION, verificationId: makeVerificationId(id), overallGrade: graded.overallGrade, confidence: graded.confidence, gradingNotes: graded.notes, sizeDistribution: makeSizeDistribution(quality), detections: makeDetections(id, sampleSize), multimodal, corrections: 0 });
    timer.current = window.setInterval(() => {
      completed += 1;
      if (completed >= processingSteps.length) {
        if (timer.current !== null) window.clearInterval(timer.current);
        timer.current = null;
        setProcessing(false); setResult(batch); saveBatch(batch);
        window.setTimeout(() => resultRef.current?.focus({ preventScroll: true }), 50);
      } else setStep(completed);
    }, 950);
  };
  const cancel = () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; setProcessing(false); setStep(0); };
  const reset = () => { fileRequest.current += 1; setImage(null); setImageReady(false); setFileName(''); setImageSource(''); setResult(null); setError(''); setLoadingImage(false); };
  const openCamera = () => {
    if (window.matchMedia('(pointer: coarse)').matches) camera.current?.click();
    else setCameraOpen(true);
  };
  const useSample = () => { fileRequest.current += 1; setLoadingImage(false); setImageReady(true); setImage(ASSETS.onions); setFileName('example-onion-sample.jpg'); setImageSource('sample'); setResult(null); setError(''); };
  return <div className="container interior-page page-enter">
    <PageHeading title="AI Quality Assessment" description="Upload a clear image of your onion sample to begin."><a className="text-link" href="#/history">{t('Assessment History')}<ArrowRight size={16} /></a></PageHeading>
    <Notice><strong>{t('Prototype mode')}. </strong>This demonstration simulates AI processing. Results and bounding boxes are illustrative, not predictions from a connected AI model. {!online && <><br /><strong>Offline mode:</strong> results will be stored locally and queued for sync.</>}</Notice>
    <div className="assessment-layout">
      <section className="assessment-input" aria-labelledby="upload-title"><div className="panel-heading"><span className="panel-number">01</span><h2 id="upload-title">{t('Upload / Camera')}</h2></div>
        <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(event) => { void loadFile(event.target.files?.[0], 'upload'); event.target.value = ''; }} aria-label="Choose onion image" />
        <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(event) => { void loadFile(event.target.files?.[0], 'camera'); event.target.value = ''; }} aria-label="Take an onion photograph" />
        {!image ? <div className={`upload-zone ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void loadFile(event.dataTransfer.files[0], 'upload'); }}>
          {loadingImage ? <Loader2 size={39} className="spin" /> : <ImagePlus size={43} strokeWidth={1.2} />}
          <h3>{loadingImage ? 'Preparing your image...' : 'Drop your onion image here'}</h3><p>Use a clear, well-lit image with the onions visible.</p>
          <div className="upload-options"><button className="button button-primary" onClick={() => upload.current?.click()} disabled={loadingImage}><Upload size={17} />{t('Upload Image')}</button><button className="button button-secondary" onClick={openCamera} disabled={loadingImage}><Camera size={17} />{t('Capture Image')}</button></div>
          <small>JPG, PNG or WebP. Maximum file size: 10 MB.</small>
        </div> : <div className="selected-image"><div className={`image-preview ${processing ? 'is-scanning' : ''}`}><img src={image} alt="Selected onion sample for assessment" onLoad={() => setImageReady(true)} onError={() => { cancel(); setError('The sample image could not be loaded. Please upload an image from your device.'); setImage(null); setImageReady(false); }} />{processing && <div className="scan-line" />}</div><div className="selected-image-meta"><span title={fileName}><ImagePlus size={15} />{fileName}</span><div><button className="icon-button" disabled={processing || loadingImage} onClick={() => upload.current?.click()} aria-label="Replace image" title="Replace image"><RefreshCw size={16} /></button><button className="icon-button" disabled={processing} onClick={reset} aria-label="Remove image" title="Remove image"><Trash2 size={16} /></button></div></div>
        <div className="image-action-row"><button className="button button-secondary" disabled={processing || loadingImage} onClick={openCamera}><Camera size={15} />Retake</button><button className="button button-secondary" disabled={processing || loadingImage} onClick={() => upload.current?.click()}><Upload size={15} />Replace</button><button className="button button-secondary" disabled={processing} onClick={reset}><Trash2 size={15} />Remove</button></div>
        {imageSource === 'camera' && <p className="small-muted">Captured with device camera. Retake if the sample is blurry or poorly lit.</p>}</div>}
        {!image && <button className="sample-image-link" onClick={useSample} disabled={loadingImage}><ImagePlus size={16} />{t('Try a sample image')}<ArrowRight size={14} /></button>}
        {error && <p className="form-error" role="alert"><Info size={16} />{error}</p>}
        <div className="assessment-fields"><label className="field"><span>{t('Batch ID')}</span><input value={result?.id || nextId} readOnly aria-label="Automatically assigned batch ID" /></label><label className="field"><span>{t('Sample Size')} <small>(demo)</small></span><select value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} disabled={processing || Boolean(result)}><option value={100}>100 onions</option><option value={200}>200 onions</option><option value={500}>500 onions</option></select></label><label className="field"><span>Officer Name</span><input value={officerName} onChange={(e) => setOfficerName(e.target.value)} placeholder="e.g. Priya Sharma" disabled={processing || Boolean(result)} /></label><label className="field"><span>Officer ID</span><input value={officerId} onChange={(e) => setOfficerId(e.target.value)} placeholder="e.g. OFF-1024" disabled={processing || Boolean(result)} /></label><label className="field"><span>{t('Procurement Center')}</span><select value={center} onChange={(event) => setCenter(event.target.value)} disabled={processing || Boolean(result)}>{CENTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Inspection Location</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Yard / shed / gate number" disabled={processing || Boolean(result)} /></label></div>
        <div className="multimodal-input"><h3><Ruler size={16} />Multimodal Inputs <small>(optional)</small></h3><div className="multimodal-status-row"><span className="sensor-pill is-on">Vision · Connected</span><span className="sensor-pill">Depth · Sensor not connected</span><span className="sensor-pill">Weight · Sensor not connected</span></div><div className="assessment-fields"><label className="field"><span><Weight size={13} /> Weight (optional manual)</span><input value={multimodal.weightValue} onChange={(e) => setMultimodal({ ...multimodal, weightValue: e.target.value, weight: e.target.value ? 'connected' : 'not-connected' })} placeholder="e.g. 42.5 kg" disabled={processing || Boolean(result)} /></label><label className="field"><span><Ruler size={13} /> Depth note (optional)</span><input value={multimodal.depthValue} onChange={(e) => setMultimodal({ ...multimodal, depthValue: e.target.value, depth: e.target.value ? 'connected' : 'not-connected' })} placeholder="e.g. calibrated tray used" disabled={processing || Boolean(result)} /></label></div><p className="small-muted">Depth and weight hardware are not connected in this prototype. Manual entries are labeled as such; no fake sensor readings are generated.</p></div>
        {result ? <button className="button button-secondary full-width" onClick={reset}><ImagePlus size={18} />{t('New Assessment')}</button> : <button className="button button-primary full-width start-assessment" disabled={!image || !imageReady || processing || loadingImage} onClick={start}>{processing ? <Loader2 className="spin" size={18} /> : <ScanLine size={19} />}{t(processing ? processingSteps[step] : 'Start AI Assessment')}<ArrowRight size={17} /></button>}
        <p className="local-privacy"><ShieldIcon />Images are processed locally for this demo and are not uploaded to a server. Active policy: {policy.version}.</p>
      </section>
      <section className="assessment-output" aria-labelledby="result-title" aria-busy={processing}><div className="panel-heading"><span className="panel-number">02</span><h2 id="result-title">{t('Assessment Result')}</h2></div>
        {processing ? <div className="processing-state" role="status"><div className="processing-icon"><ScanLine size={32} strokeWidth={1.5} /></div><h3>Assessment in progress</h3><p>Please keep this page open while the demo runs.</p><ol className="processing-steps">{processingSteps.map((label, index) => <li className={index < step ? 'is-complete' : index === step ? 'is-current' : ''} key={label}><span>{index < step ? <Check size={14} /> : index === step ? <Loader2 size={14} className="spin" /> : String(index + 1).padStart(2, '0')}</span>{t(label)}{index < step && <small>Done</small>}</li>)}</ol><div className="processing-track"><span style={{ width: `${(step + 1) * 20}%` }} /></div><button className="text-link cancel-link" onClick={cancel}>{t('Cancel')}</button></div> : result ? <div className="completed-result page-enter" ref={resultRef} tabIndex={-1}><div className="completion-status" role="status"><CircleCheck size={19} /><strong>{t('Assessment Completed')}</strong></div><QualitySummary batch={result} compact /><GradingExplanation batch={result} /><div className="result-actions"><a href={`#/reports/${result.id}`} className="button button-primary">{t('Generate Report')}<ArrowRight size={16} /></a><a href={`#/results/${result.id}`} className="button button-secondary">{t('View Full Result')}</a></div><p className="small-muted">Simulated result saved with batch {result.id}. URS is a demonstration category; see Standards.</p></div> : <div className="result-placeholder"><ScanLine size={49} strokeWidth={1.1} /><h3>{t('Your results will appear here')}</h3><p>{t('Select an image and start the assessment to view the quality breakdown.')}</p><div className="placeholder-legend"><span><i className="dot-navy" />{t('Grade A')}</span><span><i className="dot-amber" />{t('URS')}</span><span><i className="dot-red" />{t('Defects')}</span></div></div>}
      </section>
    </div>
    <div className="capture-guidance"><Info size={19} /><div><h3>For a better sample image</h3><p>Place the onions on a plain surface. Use even lighting, avoid overlapping onions and keep the entire sample in focus. Actual grading requires an authorized model and calibrated sampling procedure.</p></div><a href="#/help" className="text-link">{t('Help')}<ArrowRight size={15} /></a></div>
    {cameraOpen && <CameraDialog onClose={() => setCameraOpen(false)} onCapture={(file) => { void loadFile(file, 'camera'); }} onUpload={() => upload.current?.click()} />}
  </div>;
}

function ShieldIcon() {
  return <svg width="13" height="15" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M8 1 14 3v5c0 4-6 8-6 8S2 12 2 8V3l6-2Z" stroke="currentColor" /><path d="m5 8 2 2 4-4" stroke="currentColor" /></svg>;
}
