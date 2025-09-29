"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple test to check if TypeScript is working
console.log('=== SIMPLE TEST SERVER ===');
var express_1 = require("express");
var app = (0, express_1.default)();
var PORT = 3001;
app.get('/test', function (_req, res) {
    res.json({ message: 'Test server is working!' });
});
app.listen(PORT, function () {
    console.log("Test server running on port ".concat(PORT));
});
console.log('Test server setup complete');
