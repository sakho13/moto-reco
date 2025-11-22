FROM node:20.11.0

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y openjdk-17-jre && \
    apt-get clean

# Firebase CLI のインストール
RUN npm install -g firebase-tools@14.7.0

COPY . .

# エミュレータ起動ポートを開ける
EXPOSE 4000 8080 9000 9099 5001 5000 9199 8085

CMD ["firebase", "emulators:start", "--only", "auth"]
