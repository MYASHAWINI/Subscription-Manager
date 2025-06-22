app.put('/subscription/pause/:userId', async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.params.userId });
        if (!subscription || subscription.status !== 'Active') {
            return res.status(400).json({ message: 'Subscription cannot be paused' });
        }

        subscription.status = 'Paused';
        subscription.pausedAt = new Date();
        await subscription.save();

        res.json({ message: 'Subscription paused successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error pausing subscription', error });
    }
});
