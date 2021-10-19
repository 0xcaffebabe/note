import BaseService from "./BaseService";
import fs from 'fs'
import { mdToPdf } from 'md-to-pdf'
import PdfContent from "../dto/PdfContent";

class BookService extends BaseService{

  static async md2pdf(content: string): Promise<PdfContent> {
    const pdf = await mdToPdf({content}, {basedir: __dirname + "/doc"})
    return {
      filename: pdf.filename || '',
      content: pdf.content
    }
  }
}
export default BookService