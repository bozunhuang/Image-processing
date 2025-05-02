from flask import Flask, render_template, request, redirect, flash
from PIL import Image
import io
import base64

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():

    file = request.files['image']

    # Check if a file was selected
    if file.filename == '':
        flash('No image selected')
        return redirect(request.url)

    # Get the number input
    number = request.form.get('number', type=int, default=1)

    try:
        img = Image.open(file.stream)
        im1 = quad_merge(img)
        im2 = slicing(im1, number)
        
        img_io = io.BytesIO()
        im2.save(img_io, 'PNG')
        img_io.seek(0)
        img_data = base64.b64encode(img_io.getvalue()).decode('utf-8')

        # Create data URL for the image
        result_image = f"data:image/jpeg;base64,{img_data}"

        return render_template('index.html', result=result_image)
        
    except Exception as e:
        flash(f'Error processing image: {str(e)}')
        return redirect(request.url)

def quad_merge(im1: Image.Image) -> Image.Image:
    w = im1.size[0] * 2
    h = im1.size[1] * 2
    im = Image.new("RGBA", (w, h))

    im.paste(im1)
    fl_im1 = im1.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    im.paste(fl_im1, (im1.size[0], 0))
    fl_im2 = im1.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    im.paste(fl_im2, (0, im1.size[1]))
    fl_im3 = fl_im1.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    im.paste(fl_im3, (im1.size[0], im1.size[1]))
    return im

def slicing(im: Image.Image, w_slice = 30) -> Image.Image:
    assert w_slice % 2 == 0 , "The number of slices should be even."
    w = im.size[0]
    h = im.size[1]
    sl_w = w // w_slice
    im1 = Image.new("RGBA", (im.size[0], im.size[1]))
    im2 = Image.new("RGBA", (im.size[0], im.size[1]))

    for index in range(w_slice//2):
        box1 = (index * sl_w, 0, (1 + index) * sl_w, h)
        box2 = ((w_slice - index - 1) * sl_w, 0, (w_slice - index) * sl_w, h)
        region1 = im.crop(box1)
        region2 = im.crop(box2)
        pos1 = (2 * index * sl_w, 0, (1 + 2 * index) * sl_w, h)
        pos2 = ((1 + 2 * index) * sl_w, 0, (2 + 2 * index) * sl_w, h)
        im1.paste(region1, pos1)
        im1.paste(region2, pos2)

    h_slice = w_slice * h // w
    sl_h = h // h_slice

    for index in range(h_slice//2):
        box1 = (0, index * sl_h, w, (1 + index) * sl_h)
        box2 = (0, (h_slice - index - 1) * sl_h, w, (h_slice - index) * sl_h)
        region1 = im1.crop(box1)
        region2 = im1.crop(box2)
        pos1 = (0, 2 * index * sl_h, w, (1 + 2 * index) * sl_h)
        pos2 = (0, (1 + 2 * index) * sl_h, w, (2 + 2 * index) * sl_h)
        im2.paste(region1, pos1)
        im2.paste(region2, pos2)
    return im2


if __name__ == '__main__':
    app.run(debug=True)