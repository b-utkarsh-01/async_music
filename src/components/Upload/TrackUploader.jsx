import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadTrackFile, addTrackViaUrl } from '../../services/upload';

export default function TrackUploader({ onUploaded } = {}) {
  const { user } = useAuth();
  const [mode, setMode] = useState('file'); // 'file' or 'url'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  const ALLOWED = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/x-m4a',
    'audio/mp4',
    'audio/aac',
  ];

  const handleFile = (e) => {
    setError('');
    setSuccess('');
    const f = e.target.files?.[0];
    if (!f) return setFile(null);
    if (f.size > MAX_SIZE) return setError('File is too large (max 50MB)');
    if (!ALLOWED.includes(f.type)) return setError('Unsupported audio format');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (mode === 'file') {
      if (!file) return setError('Please choose a file first');
    } else {
      if (!url) return setError('Please enter a URL');
    }
    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let res;
      if (mode === 'file') {
        res = await uploadTrackFile({
          file,
          user,
          title: title || file.name,
          artist,
          tags: tagsArray,
          onProgress: (p) => setProgress(p),
        });
      } else {
        res = await addTrackViaUrl({
          url,
          user,
          title: title || 'Untitled',
          artist,
          tags: tagsArray,
        });
      }

      setSuccess('Track added successfully');
      setFile(null);
      setUrl('');
      setTitle('');
      setArtist('');
      setTags('');
      setProgress(0);
      if (onUploaded) onUploaded(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add track');
    }
  };

  return (
    <div className="mb-6 bg-gray-900 p-4 rounded">
      <h3 className="font-semibold mb-2">Add Track</h3>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('file')}
          className={`px-3 py-1 rounded ${mode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-3 py-1 rounded ${mode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Add via URL
        </button>
      </div>

      {mode === 'file' ? (
        <div className="mb-2">
          <label className="block text-sm text-gray-300">File</label>
          <input type="file" accept="audio/*" onChange={handleFile} />
          {file && <div className="text-sm mt-1 text-gray-400">Selected: {file.name} ({Math.round(file.size / 1024)} KB)</div>}
        </div>
      ) : (
        <div className="mb-2">
          <label className="block text-sm text-gray-300">URL</label>
          <input
            type="url"
            className="w-full p-2 bg-gray-800 rounded"
            placeholder="https://example.com/song.mp3"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input className="p-2 bg-gray-800 rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="p-2 bg-gray-800 rounded" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
      </div>

      <div className="mb-2">
        <input className="w-full p-2 bg-gray-800 rounded" placeholder="Tags (comma separated) eg. happy,neutral" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} className="bg-green-600 px-3 py-1 rounded text-white">
          {mode === 'file' ? 'Upload' : 'Add Track'}
        </button>
        <div className="text-sm text-gray-400">{progress > 0 ? `Progress: ${progress}%` : ''}</div>
      </div>

      {progress > 0 && (
        <div className="w-full bg-gray-800 h-2 rounded mt-2">
          <div className="bg-green-500 h-2 rounded" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <div className="text-red-400 mt-2">{error}</div>}
      {success && <div className="text-green-400 mt-2">{success}</div>}
    </div>
  );
}
