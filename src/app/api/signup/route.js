import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect'
import User from '../../../models/userModel';
import bcrypt from 'bcryptjs';
export async function POST(request) {
  try {
    await dbConnect();
    const { name, email, password } = await request.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword, 
    });

    await newUser.save();

    return NextResponse.json({ message: 'User created successfully', user: { name: newUser.name, email: newUser.email } }, { status: 201 });
  } catch (error) {
    console.error('Signup Error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'An error occurred during signup', error: error.message }, { status: 500 });
  }
}
