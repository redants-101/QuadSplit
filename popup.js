document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('uploadBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const imageInput = document.getElementById('imageInput');
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');
    let processedImages = [];

    uploadBtn.addEventListener('click', function() {
        imageInput.click();
    });

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.src = event.target.result;
                preview.style.display = 'block';
                status.textContent = '正在处理图片...';
                
                const img = new Image();
                img.onload = function() {
                    // 清空之前的处理结果
                    processedImages = [];
                    
                    const width = img.width;
                    const height = img.height;
                    const halfWidth = Math.floor(width / 2);
                    const halfHeight = Math.floor(height / 2);

                    // 创建四个画布，分别处理四个部分
                    const positions = [
                        { x: 0, y: 0, name: "左上" },
                        { x: halfWidth, y: 0, name: "右上" },
                        { x: 0, y: halfHeight, name: "左下" },
                        { x: halfWidth, y: halfHeight, name: "右下" }
                    ];

                    positions.forEach((pos, index) => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = halfWidth;
                        canvas.height = halfHeight;

                        // 绘制对应区域的图片
                        ctx.drawImage(
                            img,
                            pos.x, pos.y,
                            halfWidth, halfHeight,
                            0, 0,
                            halfWidth, halfHeight
                        );

                        canvas.toBlob(function(blob) {
                            processedImages.push({
                                blob: blob,
                                index: index,
                                position: pos.name
                            });

                            status.textContent = `已处理 ${processedImages.length}/4 (${pos.name})`;
                            
                            // 当所有图片都处理完成时
                            if (processedImages.length === 4) {
                                // 按索引排序确保顺序正确
                                processedImages.sort((a, b) => a.index - b.index);
                                status.textContent = '图片处理完成，可以下载了';
                                downloadBtn.disabled = false;
                            }
                        }, 'image/png', 1.0);
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    downloadBtn.addEventListener('click', function() {
        if (processedImages.length === 4) {
            status.textContent = '正在准备下载...';
            downloadBtn.disabled = true;

            let downloadedCount = 0;
            processedImages.forEach((image, index) => {
                const url = URL.createObjectURL(image.blob);
                chrome.downloads.download({
                    url: url,
                    filename: `split_image_${index + 1}_${image.position}.png`,
                    saveAs: index === 0
                }, () => {
                    URL.revokeObjectURL(url);
                    downloadedCount++;
                    status.textContent = `已下载 ${downloadedCount}/4 张图片`;

                    if (downloadedCount === 4) {
                        status.textContent = '所有图片下载完成！';
                        setTimeout(() => {
                            preview.style.display = 'none';
                            status.textContent = '';
                            downloadBtn.disabled = true;
                            processedImages = [];
                        }, 2000);
                    }
                });
            });
        }
    });
});
