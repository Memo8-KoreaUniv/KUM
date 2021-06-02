/* eslint-disable no-case-declarations */

import { NextApiRequest, NextApiResponse } from 'next'

import { CategoryModel, HistoryModel } from 'src/model'
import { connectToDatabase } from 'src/utils/mongo'
import { pageParser } from 'src/utils/pageParser'

/**
 * /api/user/{userId}/memos
 * @example req.query
 *   {
 *     "param": [`userId`, "memos"]
 *     "page" : 1
 *     "count" : 9
 *   }
 *
 */
export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { param } = req.query
  const userId = param[0]
  try {
    await connectToDatabase()
    switch (param[1]) {
      /* ​/api​/user​/{userId}​/memos */
      case 'memos':
        if (req.method == 'GET') {
          const { page, count } = req.query
          const histories = await HistoryModel.find({ user: userId as any })
          const obj: { [key: string]: any } = {}
          for (const history of histories) {
            const memoId = history.memo as any
            if (obj[memoId]) {
              if (
                obj[memoId].createdAt.getTime() < history.createdAt.getTime()
              ) {
                obj[memoId] = history
              }
            } else {
              obj[memoId] = history
            }
          }
          const listMemoResult = pageParser(
            Object.values(obj),
            page as string,
            count as string,
          )

          res.status(200).json({ memos: listMemoResult })
        }
        break
      case 'category':
        if (req.method == 'POST') {
          const { name } = req.query
          try {
            const addCategoryResult = await CategoryModel.create({
              user: userId,
              name,
            })
            res.status(200).json({ category: addCategoryResult })
          } catch (e) {
            console.log(e)
            res
              .status(409)
              .json({
                alertText: '카테고리가 이미 존재하거나 DB에 오류가 생겼습니다!',
              })
          }
        }
        break
      default:
        res.status(501).json({ alertText: 'Unexpected req Method!' })
    }
  } catch (err) {
    if (err?.response?.status) {
      res
        .status(err?.response?.status)
        .json({ alertText: err?.response?.statusText })
      return
    }
    console.log(err)
    res.status(500).json({ alertText: 'Unexpected Server Error' })
  }
}
