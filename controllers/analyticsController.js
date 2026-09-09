const Analytics = require('../models/Analytics');

exports.logMetric = async (req, res) => {
  try {
    const { metricName, value, tags } = req.body;

    const dataPoint = await Analytics.create({
      user: req.user._id,
      metricName,
      value,
      tags
    });

    res.status(201).json({
      success: true,
      data: dataPoint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const metrics = await Analytics.find({ user: req.user._id }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};