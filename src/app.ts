import { DynamoDB, SES } from 'aws-sdk';
import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();
const ses = new SES();

const ROOM_TABLES = {
  QMB1: process.env.ROOM1_TABLE || '',
  QMB2: process.env.ROOM2_TABLE || '',
};

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  const path = event.path;
  const method = event.httpMethod;
  const roomName = event.queryStringParameters?.roomName;
  const date = event.queryStringParameters?.date;

  if (!roomName || !ROOM_TABLES[roomName]) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Invalid room name' }),
    };
  }

  if (path === '/getSlots' && method === 'GET') {
    return getSlots(roomName, date);
  } else if (path === '/getAvailableSlots' && method === 'GET') {
    return getAvailableSlots(roomName, date);
  } else if (path === '/bookSlot' && method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    return bookSlot(roomName, body);
  } else {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Not Found' }),
    };
  }
};

const getSlots = async (roomName: string, date?: string) => {
  try {
    const tableName = ROOM_TABLES[roomName];
    let params: DynamoDB.DocumentClient.ScanInput = {
      TableName: tableName,
    };

    if (date) {
      params.FilterExpression = "#d = :date";
      params.ExpressionAttributeNames = { "#d": "Date" };
      params.ExpressionAttributeValues = { ":date": date };
    }

    const slots = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(slots.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Failed to retrieve slots', error }),
    };
  }
};

const getAvailableSlots = async (roomName: string, date?: string) => {
  try {
    const tableName = ROOM_TABLES[roomName];
    let params: DynamoDB.DocumentClient.ScanInput = {
      TableName: tableName,
    };

    if (date) {
      params.FilterExpression = "#d = :date";
      params.ExpressionAttributeNames = { "#d": "Date" };
      params.ExpressionAttributeValues = { ":date": date };
    }

    const slots = await dynamoDb.scan(params).promise();
    const availableSlots = getAvailableSlotsFromItems(slots.Items);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(availableSlots),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Failed to retrieve available slots', error }),
    };
  }
};

const bookSlot = async (roomName: string, booking: { Slot: number; Email: string; Date: string }) => {
  try {
    const tableName = ROOM_TABLES[roomName];
    const bookingID = await generateBookingID(tableName);
    const params = {
      TableName: tableName,
      Item: {
        BookingID: bookingID,
        Slot: booking.Slot,
        Email: booking.Email,
        Date: booking.Date,
      },
    };

    await dynamoDb.put(params).promise();

    // Send confirmation email
    await sendConfirmationEmail(booking.Email, booking);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Booking successful' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Failed to book slot', error }),
    };
  }
};

const generateBookingID = async (tableName: string): Promise<number> => {
  const result = await dynamoDb.scan({
    TableName: tableName,
    ProjectionExpression: 'BookingID',
  }).promise();

  const ids = result.Items?.map((item) => item.BookingID) || [];
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
};

const getAvailableSlotsFromItems = (items: DynamoDB.DocumentClient.ItemList | undefined) => {
  const bookedSlots = items?.map((item) => item.Slot) || [];
  const allSlots = Array.from({ length: 16 }, (_, i) => i + 1); // Correcting to 16 slots for 8:00 AM - 11:00 PM
  return allSlots.filter(slot => !bookedSlots.includes(slot));
};

const sendConfirmationEmail = async (email: string, booking: { Slot: number; Email: string; Date: string }) => {
  const params: SES.SendEmailRequest = {
    Source: 'your-email@example.com', // Replace with your verified SES email
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Booking Confirmation for ${booking.Date}`,
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
              <div style="background-color: #4CAF50; color: white; padding: 10px; text-align: center;">
                <h1>Booking Confirmation</h1>
              </div>
              <div style="padding: 20px;">
                <p>Dear Customer,</p>
                <p>Your booking has been confirmed with the following details:</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <th style="text-align: left; padding: 8px; background-color: #f2f2f2;">Date</th>
                    <td style="padding: 8px;">${booking.Date}</td>
                  </tr>
                  <tr>
                    <th style="text-align: left; padding: 8px; background-color: #f2f2f2;">Time Slot</th>
                    <td style="padding: 8px;">${booking.Slot + 7}:00 - ${booking.Slot + 8}:00</td>
                  </tr>
                </table>
                <p>If you  would like to change ypour booking, please reply to this email, and one of our staff will get back to you.</p>
                <p>Thank you for your booking!</p>
              </div>
              <div style="background-color: #4CAF50; color: white; padding: 10px; text-align: center;">
                <p>&copy; 2024 Spandank Technologies</p>
              </div>
            </div>
          `,
        },
      },
    },
  };

  await ses.sendEmail(params).promise();
};
