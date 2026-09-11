#include "ServoControl.h"

Servo motorA, motorB, motorC;

void setupMotors(int pinA, int pinB, int pinC) {
    motorA.attach(pinA);
    motorB.attach(pinB);
    motorC.attach(pinC);
}

void openDoor(Servo &motor, int &pos) {
    for (pos = 0; pos <= 90; pos += 5) {
        motor.write(pos);
        delay(15);
    }

    delay(5000);

    for (pos = 90; pos >= 0; pos -= 5) {
        motor.write(pos);
        delay(15);
    }
}
