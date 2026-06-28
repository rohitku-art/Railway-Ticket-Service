const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { getStatus } = require('./algorithms/trainStatus');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(' ');
    const timePart = parts[0];
    const modifier = parts[1];
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

// 1. Search API
app.get('/api/search', async (req, res) => {
    const startStation = req.query.from ? req.query.from.trim().toUpperCase() : "";
    const endStation = req.query.to ? req.query.to.trim().toUpperCase() : "";

    if (!startStation || !endStation) return res.status(400).json({ error: "Provide stations" });

    try {
        const snapshot = await db.collection('trains').get();
        let globalTrainDatabase = [];
        snapshot.forEach(doc => {
            globalTrainDatabase.push({ id: doc.id, ...doc.data() });
        });

        let directTrain = globalTrainDatabase.find(t => 
            t.from.trim().toUpperCase() === startStation &&
            t.to.trim().toUpperCase() === endStation &&
            Number(t.seats) > 0
        );

        if (directTrain) return res.json({ type: "DIRECT", message: "Direct Confirmed Seats Available!", train: directTrain });

        let suggestions = [];
        globalTrainDatabase.forEach(t1 => {
            if (t1.from.trim().toUpperCase() === startStation && Number(t1.seats) > 0) {
                globalTrainDatabase.forEach(t2 => {
                    if (t2.to.trim().toUpperCase() === endStation && t1.to === t2.from && Number(t2.seats) > 0) {
                        suggestions.push({ train1: t1, train2: t2 });
                    }
                });
            }
        });
        res.json({ type: "SPLIT", message: "No direct trains, but connecting routes found!", suggestions });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// 2. Status API
app.get('/api/status/:trainNumber', (req, res) => {
    const status = getStatus(req.params.trainNumber);
    res.json({ message: status });
});

// 3. Booking API
// 3. Booking API (CORRECTED)
// 3. Booking API (UPDATED for Pricing)
app.post('/api/book', async (req, res) => {
    // Frontend se 'selectedClass' (AC, Sleeper, ya General) mangwaya hai
    const { trainId, selectedClass } = req.body; 

    try {
        const trainRef = db.collection('trains').doc(trainId);
        const trainDoc = await trainRef.get();

        if (trainDoc.exists) {
            const data = trainDoc.data();
            const currentSeats = Number(data.seats);

            // Price fetch karein (database ke 'price' map se)
            // Agar selectedClass match nahi karti toh default 0 price rahega
            const price = data.price ? (data.price[selectedClass] || 0) : 0;

            if (currentSeats > 0) {
                const newSeatCount = currentSeats - 1;
                await trainRef.update({ seats: newSeatCount });

                const formatTime = (timeField) => {
                    if (timeField && typeof timeField.toDate === 'function') {
                        return timeField.toDate().toLocaleString();
                    }
                    return timeField || "N/A";
                };

                const ticket = {
                    trainName: data.trainName, 
                    seatNo: 100 - newSeatCount,
                    class: selectedClass,      // Ticket mein class dikhegi
                    price: price,              // Ticket mein price dikhega
                    departure: formatTime(data.departureTime),
                    arrival: formatTime(data.arrivalTime),
                    pnr: "PNR-" + Math.floor(100000 + Math.random() * 900000)
                };
                
                res.json({ success: true, message: "Booking Successful!", ticket: ticket });
            } else {
                res.status(400).json({ success: false, message: "No seats available!" });
            }
        } else {
            res.status(404).json({ success: false, message: "Train not found!" });
        }
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ success: false, message: "Booking failed!" });
    }
});
// 4. Cancellation API
app.post('/api/cancel', async (req, res) => {
    const { trainId } = req.body;
    try {
        const trainRef = db.collection('trains').doc(trainId);
        const trainDoc = await trainRef.get();
        if (trainDoc.exists) {
            await trainRef.update({ seats: Number(trainDoc.data().seats) + 1 });
            res.json({ success: true, message: "Booking cancelled successfully!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Cancellation failed!" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});