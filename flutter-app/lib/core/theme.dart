import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const kPrimary = Color(0xFFE87A3D);
const kBackground = Color(0xFF121212);
const kCard = Color(0xFF1E1E1E);
const kBorder = Color(0xFF2D2D2D);
const kTextSecondary = Color(0xFF9CA3AF);
const kApiBase = 'https://api.flavorfind.dallah.co.ke';

final appTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: kBackground,
  colorScheme: const ColorScheme.dark(
    primary: kPrimary,
    surface: kCard,
  ),
  textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
  appBarTheme: const AppBarTheme(
    backgroundColor: kBackground,
    elevation: 0,
    centerTitle: false,
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: kBackground,
    selectedItemColor: kPrimary,
    unselectedItemColor: kTextSecondary,
    type: BottomNavigationBarType.fixed,
    elevation: 0,
  ),
);
