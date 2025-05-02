# Image Processing App

## Overview
A Flask web application for applying visual effects to images through quad-merge mirroring and custom slicing operations.

## Features
- Creates an artistic rendering of a given image through transposing and slicing.

## Installation
```
pip install flask pillow numpy
```

## Usage
1. Run `python app.py`
2. Visit http://127.0.0.1:5000/
3. Upload an image
4. Enter an even number for slicing
5. Click "Run Process"

## How It Works
1. **Quad Merge**: Creates mirror reflections of the image in four quadrants
2. **Slicing**: Rearranges image segments based on the provided parameter

## Technical Notes
- Slicing parameter must be even
- Built with Flask, Pillow, and HTML5

## Project Structure
```
project/
├── app.py              # Flask application
├── templates/          # HTML templates
├── static/             # CSS styling
└── uploads/            # Uploaded files
```
