#ifndef SERVOCONTROL_H
#define SERVOCONTROL_H
#include <Servo.h> 

extern Servo motorA, motorB, motorC;

void setupMotors(int pinA, int pinB, int pinC);
void openDoor(Servo &motor, int &pos);

#endif
