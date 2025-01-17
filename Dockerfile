FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

USER jenkins