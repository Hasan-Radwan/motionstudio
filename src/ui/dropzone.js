// Turns file drops / picks into an HTMLImageElement. Everything stays local.

export function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      // revoke on next tick so the decode is done
      setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Wire drag/drop on the stage and the hidden file input + upload button.
export function initDropzone({ stage, fileInput, uploadBtn, onImage }) {
  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const img = await loadImageFromBlob(file);
    onImage(img, file);
  };

  ['dragenter', 'dragover'].forEach((ev) =>
    stage.addEventListener(ev, (e) => {
      e.preventDefault();
      stage.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    stage.addEventListener(ev, (e) => {
      e.preventDefault();
      if (ev === 'dragleave' && stage.contains(e.relatedTarget)) return;
      stage.classList.remove('dragover');
    })
  );
  stage.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  });

  if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
  if (fileInput)
    fileInput.addEventListener('change', () => {
      handleFile(fileInput.files?.[0]);
      fileInput.value = '';
    });

  // paste from clipboard
  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) =>
      i.type.startsWith('image/')
    );
    if (item) handleFile(item.getAsFile());
  });
}
