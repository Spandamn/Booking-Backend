"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var aws_sdk_1 = require("aws-sdk");
var dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient();
var ROOM_TABLES = {
    QMB1: process.env.QMB1_TABLE || '',
    QMB2: process.env.QMB2_TABLE || '',
};
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var path, method, roomName, body;
    var _a;
    return __generator(this, function (_b) {
        path = event.path;
        method = event.httpMethod;
        roomName = (_a = event.queryStringParameters) === null || _a === void 0 ? void 0 : _a.roomName;
        if (!roomName || !ROOM_TABLES[roomName]) {
            return [2 /*return*/, {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Invalid room name' }),
                }];
        }
        if (path === '/getSlots' && method === 'GET') {
            return [2 /*return*/, getSlots(roomName)];
        }
        else if (path === '/getAvailableSlots' && method === 'GET') {
            return [2 /*return*/, getAvailableSlots(roomName)];
        }
        else if (path === '/bookSlot' && method === 'POST') {
            body = JSON.parse(event.body || '{}');
            return [2 /*return*/, bookSlot(roomName, body)];
        }
        else {
            return [2 /*return*/, {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Not Found' }),
                }];
        }
        return [2 /*return*/];
    });
}); };
exports.handler = handler;
var getSlots = function (roomName) { return __awaiter(void 0, void 0, void 0, function () {
    var tableName, slots, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tableName = ROOM_TABLES[roomName];
                return [4 /*yield*/, dynamoDb.scan({ TableName: tableName }).promise()];
            case 1:
                slots = _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify(slots.Items),
                    }];
            case 2:
                error_1 = _a.sent();
                return [2 /*return*/, {
                        statusCode: 500,
                        body: JSON.stringify({ message: 'Failed to retrieve slots', error: error_1 }),
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
var getAvailableSlots = function (roomName) { return __awaiter(void 0, void 0, void 0, function () {
    var tableName, slots, availableSlots, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tableName = ROOM_TABLES[roomName];
                return [4 /*yield*/, dynamoDb.scan({ TableName: tableName }).promise()];
            case 1:
                slots = _a.sent();
                availableSlots = getAvailableSlotsFromItems(slots.Items);
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify(availableSlots),
                    }];
            case 2:
                error_2 = _a.sent();
                return [2 /*return*/, {
                        statusCode: 500,
                        body: JSON.stringify({ message: 'Failed to retrieve available slots', error: error_2 }),
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
var bookSlot = function (roomName, booking) { return __awaiter(void 0, void 0, void 0, function () {
    var tableName, bookingID, params, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                tableName = ROOM_TABLES[roomName];
                return [4 /*yield*/, generateBookingID(tableName)];
            case 1:
                bookingID = _a.sent();
                params = {
                    TableName: tableName,
                    Item: {
                        BookingID: bookingID,
                        Slot: booking.Slot,
                        Email: booking.Email,
                        Date: booking.Date,
                    },
                };
                return [4 /*yield*/, dynamoDb.put(params).promise()];
            case 2:
                _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'Booking successful' }),
                    }];
            case 3:
                error_3 = _a.sent();
                return [2 /*return*/, {
                        statusCode: 500,
                        body: JSON.stringify({ message: 'Failed to book slot', error: error_3 }),
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); };
var generateBookingID = function (tableName) { return __awaiter(void 0, void 0, void 0, function () {
    var result, ids;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, dynamoDb.scan({
                    TableName: tableName,
                    ProjectionExpression: 'BookingID',
                }).promise()];
            case 1:
                result = _b.sent();
                ids = ((_a = result.Items) === null || _a === void 0 ? void 0 : _a.map(function (item) { return item.BookingID; })) || [];
                return [2 /*return*/, ids.length > 0 ? Math.max.apply(Math, ids) + 1 : 1];
        }
    });
}); };
var getAvailableSlotsFromItems = function (items) {
    var bookedSlots = (items === null || items === void 0 ? void 0 : items.map(function (item) { return item.Slot; })) || [];
    var allSlots = Array.from({ length: 24 }, function (_, i) { return i + 1; }); // Assuming 24 slots
    return allSlots.filter(function (slot) { return !bookedSlots.includes(slot); });
};
