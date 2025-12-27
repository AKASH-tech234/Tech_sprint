import httpStatus from "http-status";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

/* ======================
   SIGNUP
====================== */
export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "All fields are required",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "citizen",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(httpStatus.CREATED).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

/* ======================
   LOGIN
====================== */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Email and password required",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(httpStatus.OK).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};
