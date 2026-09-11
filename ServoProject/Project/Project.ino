#include "ServoControl.h"

int posA = 0, posB = 0, posC = 0; 
void setup() {
    Serial.begin(9600);         
    setupMotors(2, 3, 4);     
}

void loop() {
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n'); 

        if (command == "OPEN_A") {
            openDoor(motorA, posA);
        } else if (command == "OPEN_B") {
            openDoor(motorB, posB);
        } else if (command == "OPEN_C") {
            openDoor(motorC, posC);
        }
    }
}
