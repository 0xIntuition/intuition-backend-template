FROM ipfs/kubo:master-latest

VOLUME /data/ipfs
EXPOSE 4001 4002 4003 5001 8080
# Add the custom entrypoint script
COPY ipfs/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
