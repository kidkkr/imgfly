import { NextObserver } from 'rxjs'
import EditorEvent from './EditorEvent'
import EditorEventType from './EditorEventType'

export default class EditorEventObserver implements NextObserver<EditorEvent> {
  canvas: HTMLCanvasElement
  undoStack: Blob[]
  redoStack: Blob[]

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.undoStack = []
    this.redoStack = []
  }

  private reinvalidateCanvas() {
    const context = this.canvas.getContext('2d')
    if (!context) return

    if (this.undoStack.length > 0) {
      const blob = this.undoStack[this.undoStack.length - 1]
      const imageUrl = URL.createObjectURL(blob)
      const image = new Image()
      image.onload = () => {
        context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        context.drawImage(image, 0, 0)
        URL.revokeObjectURL(imageUrl)
      }
      image.src = imageUrl
    } else {
      context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

  }

  next = (e: EditorEvent) => {
    const context = this.canvas.getContext('2d')
    if (!context) return

    switch (e.type) {
      case EditorEventType.Draw: {
        const path = new Path2D(e.path)
        context.beginPath()
        context.strokeStyle = e.stroke
        context.stroke(path)
        return
      }

      case EditorEventType.DrawEnd: {
        this.canvas.toBlob((blob) => {
          if (!blob) return
          this.undoStack.push(blob)
          this.redoStack = []
        })
        return
      }

      case EditorEventType.Undo: {
        const undo = this.undoStack.pop()
        if (undo) {
          this.redoStack.push(undo)
        }
        this.reinvalidateCanvas()
        return
      }

      case EditorEventType.Redo: {
        const redo = this.redoStack.pop()
        if (redo) {
          this.undoStack.push(redo)
        }
        this.reinvalidateCanvas()
        return
      }

      default:
        return
    }
  }
}