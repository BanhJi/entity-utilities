'use strict'

const AWS = require('aws-sdk')
const code = require('../../config/code.js')
const message = require('../../config/message.js')
const json = require('../../config/response.js')
const uuid = require('uuid')
// const myFunc = require('../functions/functions')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.create = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      // create new
      head = 'ubs-branch' + uuid.v1()
    } else {
      // put function
      head = data.id
    }
    const pk = head
    const Branch = {
      sk: sk,
      pk: pk,
      number: data.number,
      name: data.name,
      abbr: data.abbr,
      representative: data.representative,
      expireDate: data.expireDate,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          number: data.number,
          name: data.name,
          abbr: data.abbr,
          representative: data.representative,
          expireDate: data.expireDate,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    for (let i = 0; i < lines.length; i += 25) {
      const upperLimit = Math.min(i + 25, lines.length)
      const newItems = lines.slice(i, upperLimit)
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: newItems
            }
          })
          .promise()
      } catch (e) {
        console.log('arr ', JSON.stringify(e), JSON.stringify(newItems))
        console.error('There was an error while processing the request')
        break
      }
    }
    // response back
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.Created, Branch, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
